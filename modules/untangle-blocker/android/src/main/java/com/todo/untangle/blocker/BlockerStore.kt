package com.todo.untangle.blocker

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Native source of truth (02-android-platform §2.1): locks, settings, focus session, today's
 * counters, active unlocks and the heartbeat, in SharedPreferences `untangle_blocker` as JSON.
 * Parsed once and kept in memory; written on change. One instance per process.
 */
class BlockerStore private constructor(context: Context) : TrackerState {
  private val prefs: SharedPreferences =
    context.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE)

  @Volatile override var locks: Map<String, Lock> = parseLocks(prefs.getString(K_LOCKS, null))
    private set
  @Volatile var settings: BlockerSettings = parseSettings(prefs.getString(K_SETTINGS, null))
    private set
  @Volatile override var focus: FocusSession? = parseFocus(prefs.getString(K_FOCUS, null))
    private set
  private var countersDay: String? = prefs.getString(K_COUNTERS_DAY, null)
  private val counters: MutableMap<String, Counters> = parseCounters(prefs.getString(K_COUNTERS, null))
  private val unlocks: MutableMap<String, Long> = parseLongMap(prefs.getString(K_UNLOCKS, null))

  // ---- locks / settings / focus (written by JS) ----

  fun locksList(): List<Lock> = locks.values.sortedBy { it.createdAt }

  @SuppressLint("ApplyCommitPref")
  fun setLocks(list: List<Lock>) {
    locks = list.associateBy { it.targetKey }
    prefs.edit().putString(K_LOCKS, locksJson(list).toString()).commit()
  }

  fun setSettings(s: BlockerSettings) {
    settings = s
    prefs.edit().putString(K_SETTINGS, JSONObject()
      .put("unlockMinutesGentle", s.unlockMinutesGentle)
      .put("unlockMinutesFirm", s.unlockMinutesFirm)
      .put("firmWaitSeconds", s.firmWaitSeconds).toString()).apply()
  }

  @SuppressLint("ApplyCommitPref")
  fun setFocus(f: FocusSession?) {
    focus = f
    val e = prefs.edit()
    if (f == null) e.remove(K_FOCUS) else e.putString(K_FOCUS, JSONObject()
      .put("endAt", f.endAt).put("targets", JSONArray(f.targetKeys.toList())).toString())
    e.commit()
  }

  // ---- counters (written by the service) ----

  @Synchronized
  override fun counters(day: String, key: String): Counters {
    rollTo(day)
    return counters[key] ?: Counters()
  }

  @Synchronized
  override fun setCounters(day: String, key: String, c: Counters) {
    rollTo(day)
    counters[key] = c
    saveCounters()
  }

  @Synchronized
  fun todayCounters(day: String): Map<String, Counters> {
    rollTo(day)
    return counters.toMap()
  }

  /** Midnight: a new day key starts from zero; yesterday is dropped (§4.1). */
  private fun rollTo(day: String) {
    if (countersDay == day) return
    // Keep "last left" times so a target open across midnight isn't a new open.
    val carried = counters.mapValues { Counters(lastLeftAt = it.value.lastLeftAt) }
    counters.clear()
    counters.putAll(carried.filterValues { it.lastLeftAt != null })
    countersDay = day
    saveCounters()
  }

  private fun saveCounters() {
    val o = JSONObject()
    counters.forEach { (k, c) ->
      o.put(k, JSONObject().put("usedMs", c.usedMs).put("opens", c.opens)
        .put("unlocksUsed", c.unlocksUsed).put("lastLeftAt", c.lastLeftAt ?: JSONObject.NULL))
    }
    prefs.edit().putString(K_COUNTERS_DAY, countersDay).putString(K_COUNTERS, o.toString()).apply()
  }

  // ---- unlocks ----

  @Synchronized
  override fun unlockUntil(key: String): Long? = unlocks[key]

  @Synchronized
  fun grantUnlock(day: String, key: String, until: Long) {
    unlocks[key] = until
    unlocks.entries.removeIf { it.value < System.currentTimeMillis() - 60_000 }
    prefs.edit().putString(K_UNLOCKS, JSONObject(unlocks as Map<*, *>).toString()).apply()
    val c = counters(day, key)
    setCounters(day, key, c.copy(unlocksUsed = c.unlocksUsed + 1))
  }

  // ---- heartbeat ----

  fun heartbeat(now: Long) {
    prefs.edit().putLong(K_HEARTBEAT, now).apply()
  }

  fun lastHeartbeat(): Long? = prefs.getLong(K_HEARTBEAT, 0L).takeIf { it > 0 }

  companion object {
    private const val FILE = "untangle_blocker"
    private const val K_LOCKS = "locks"
    private const val K_SETTINGS = "settings"
    private const val K_FOCUS = "focus"
    private const val K_COUNTERS = "counters"
    private const val K_COUNTERS_DAY = "countersDay"
    private const val K_UNLOCKS = "unlocks"
    private const val K_HEARTBEAT = "heartbeat"

    @Volatile private var instance: BlockerStore? = null

    fun get(context: Context): BlockerStore =
      instance ?: synchronized(this) { instance ?: BlockerStore(context).also { instance = it } }

    /** Local calendar day, YYYY-MM-DD (00-foundations §7: computed from local time every time). */
    fun dayOf(ms: Long): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(ms))

    fun locksJson(list: List<Lock>): JSONArray = JSONArray().apply {
      list.forEach { l ->
        put(JSONObject().put("id", l.id).put("targetKey", l.targetKey).put("label", l.label)
          .put("dailyMinutes", l.dailyMinutes ?: JSONObject.NULL)
          .put("dailyOpens", l.dailyOpens ?: JSONObject.NULL)
          .put("strictness", l.strictness.js()).put("enabled", l.enabled).put("createdAt", l.createdAt))
      }
    }

    private fun parseLocks(json: String?): Map<String, Lock> = runCatching {
      val a = JSONArray(json ?: "[]")
      (0 until a.length()).map { i ->
        val o = a.getJSONObject(i)
        Lock(
          id = o.getString("id"),
          targetKey = o.getString("targetKey"),
          label = o.optString("label"),
          dailyMinutes = if (o.isNull("dailyMinutes")) null else o.getInt("dailyMinutes"),
          dailyOpens = if (o.isNull("dailyOpens")) null else o.getInt("dailyOpens"),
          strictness = Strictness.parse(o.optString("strictness")),
          enabled = o.optBoolean("enabled", true),
          createdAt = o.optLong("createdAt"),
        )
      }.associateBy { it.targetKey }
    }.getOrDefault(emptyMap())

    private fun parseSettings(json: String?): BlockerSettings = runCatching {
      val o = JSONObject(json ?: "{}")
      BlockerSettings(
        unlockMinutesGentle = o.optInt("unlockMinutesGentle", 5),
        unlockMinutesFirm = o.optInt("unlockMinutesFirm", 3),
        firmWaitSeconds = o.optInt("firmWaitSeconds", 30),
      )
    }.getOrDefault(BlockerSettings())

    private fun parseFocus(json: String?): FocusSession? = runCatching {
      if (json == null) return null
      val o = JSONObject(json)
      val t = o.getJSONArray("targets")
      FocusSession(o.getLong("endAt"), (0 until t.length()).map(t::getString).toSet())
    }.getOrNull()

    private fun parseCounters(json: String?): MutableMap<String, Counters> = runCatching {
      val o = JSONObject(json ?: "{}")
      o.keys().asSequence().associateWith { k ->
        val c = o.getJSONObject(k)
        Counters(
          usedMs = c.optLong("usedMs"),
          opens = c.optInt("opens"),
          unlocksUsed = c.optInt("unlocksUsed"),
          lastLeftAt = if (c.isNull("lastLeftAt")) null else c.optLong("lastLeftAt"),
        )
      }.toMutableMap()
    }.getOrDefault(mutableMapOf())

    private fun parseLongMap(json: String?): MutableMap<String, Long> = runCatching {
      val o = JSONObject(json ?: "{}")
      o.keys().asSequence().associateWith { o.getLong(it) }.toMutableMap()
    }.getOrDefault(mutableMapOf())
  }
}
