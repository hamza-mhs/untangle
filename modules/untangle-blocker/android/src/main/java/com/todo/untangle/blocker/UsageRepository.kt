package com.todo.untangle.blocker

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import java.util.Calendar

/**
 * Screen time and pick-ups from UsageStatsManager.queryEvents (02-android-platform §5). Never the
 * daily buckets of queryUsageStats: they are UTC-aligned on some versions.
 */
class UsageRepository(private val context: Context) {
  data class Day(
    val screenTimeMs: Long,
    /** null on API 26–27 (no KEYGUARD_HIDDEN). */
    val pickups: Int?,
    val perApp: Map<String, Long>,
    val pickupsByHour: IntArray,
  )

  fun hasAccess(): Boolean {
    val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    } else {
      @Suppress("DEPRECATION")
      ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  /** Local midnight of the day containing `ms`. */
  private fun midnight(ms: Long): Long = Calendar.getInstance().apply {
    timeInMillis = ms
    set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
  }.timeInMillis

  private fun nextMidnight(ms: Long): Long = Calendar.getInstance().apply {
    timeInMillis = midnight(ms)
    add(Calendar.DAY_OF_MONTH, 1)
  }.timeInMillis

  private val excluded: Set<String> by lazy {
    val home = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
    val launchers = context.packageManager.queryIntentActivities(home, 0).map { it.activityInfo.packageName }
    (launchers + context.packageName + "com.android.systemui").toSet()
  }

  fun today(now: Long = System.currentTimeMillis()): Day = window(midnight(now), now)

  /** One entry per local day from `from` to `to` (inclusive, YYYY-MM-DD). */
  fun range(from: String, to: String): List<Pair<String, Day>> {
    val out = mutableListOf<Pair<String, Day>>()
    var start = parseDay(from) ?: return out
    val end = parseDay(to) ?: return out
    val now = System.currentTimeMillis()
    while (start <= end && start <= now) {
      val stop = minOf(nextMidnight(start), now)
      out.add(BlockerStore.dayOf(start) to window(start, stop))
      start = nextMidnight(start)
    }
    return out
  }

  private fun parseDay(s: String): Long? = runCatching {
    val (y, m, d) = s.split('-').map { it.toInt() }
    Calendar.getInstance().apply { clear(); set(y, m - 1, d) }.timeInMillis
  }.getOrNull()

  private fun window(start: Long, end: Long): Day {
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val events = usm.queryEvents(start, end)
    val perApp = HashMap<String, Long>()
    val hours = IntArray(24)
    var pickups = 0
    var fgPackage: String? = null
    var fgSince = 0L
    val e = UsageEvents.Event()
    val cal = Calendar.getInstance()
    // Constants 1 and 2 are ACTIVITY_RESUMED / ACTIVITY_PAUSED (API 29+) and the older
    // MOVE_TO_FOREGROUND / MOVE_TO_BACKGROUND: same values.
    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      when (e.eventType) {
        1 -> {
          fgPackage?.let { add(perApp, it, e.timeStamp - fgSince) }
          fgPackage = e.packageName
          fgSince = e.timeStamp
        }
        2 -> if (e.packageName == fgPackage) {
          add(perApp, e.packageName, e.timeStamp - fgSince)
          fgPackage = null
        }
        KEYGUARD_HIDDEN -> {
          pickups++
          cal.timeInMillis = e.timeStamp
          hours[cal.get(Calendar.HOUR_OF_DAY)]++
        }
        SCREEN_NON_INTERACTIVE -> fgPackage?.let {
          add(perApp, it, e.timeStamp - fgSince)
          fgPackage = null
        }
      }
    }
    fgPackage?.let { add(perApp, it, end - fgSince) }
    val counted = perApp.filterKeys { it !in excluded }.filterValues { it > 0 }
    return Day(
      screenTimeMs = counted.values.sum(),
      pickups = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) pickups else null,
      perApp = counted,
      pickupsByHour = hours,
    )
  }

  private fun add(map: HashMap<String, Long>, pkg: String, ms: Long) {
    if (ms > 0) map[pkg] = (map[pkg] ?: 0L) + ms
  }

  private companion object {
    /** UsageEvents.Event.KEYGUARD_HIDDEN (API 28). */
    const val KEYGUARD_HIDDEN = 18
    /** UsageEvents.Event.SCREEN_NON_INTERACTIVE (API 28). */
    const val SCREEN_NON_INTERACTIVE = 16
  }
}
