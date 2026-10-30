package com.todo.untangle.blocker

/**
 * The blocking rules (02-android-platform §4). Pure Kotlin: no Android types, no clock, no
 * storage, so every rule is unit-tested on the JVM.
 */
object EnforcementEngine {
  /** Coming back within this long is the same open (§4.1). */
  const val SAME_OPEN_MS = 30_000L

  /** §4.2: what to do with `targetKey` now. `counters` already includes the current open. */
  fun decide(
    targetKey: String,
    now: Long,
    locks: Map<String, Lock>,
    counters: Counters,
    unlockUntil: Long?,
    focus: FocusSession?,
  ): Decision {
    if (focus != null && focus.endAt > now && focus.targetKeys.contains(targetKey)) {
      return Decision.Block(BlockReason.FOCUS)
    }
    val lock = locks[targetKey]
    if (lock == null || !lock.enabled) return Decision.Allow(null)
    if (unlockUntil != null && unlockUntil > now) return Decision.Allow(unlockUntil)
    val minutes = lock.dailyMinutes
    if (minutes == 0) return Decision.Block(BlockReason.ALWAYS)
    val opens = lock.dailyOpens
    if (opens != null && counters.opens > opens) return Decision.Block(BlockReason.OPENS)
    if (minutes != null) {
      val allowedMs = minutes * 60_000L
      if (counters.usedMs >= allowedMs) return Decision.Block(BlockReason.TIME)
      return Decision.Allow(now + (allowedMs - counters.usedMs))
    }
    return Decision.Allow(null)
  }

  /** §4.1: a new open unless the target was away for 30 s or less. */
  fun isNewOpen(lastLeftAt: Long?, now: Long): Boolean =
    lastLeftAt == null || now - lastLeftAt > SAME_OPEN_MS

  /** The next unlock length for a target, or null when no unlock is allowed (§4.6). */
  fun unlockMinutes(lock: Lock, counters: Counters, settings: BlockerSettings): Int? {
    if (counters.unlocksUsed >= unlockCap(lock.strictness)) return null
    return when (lock.strictness) {
      Strictness.GENTLE -> settings.unlockMinutesGentle
      Strictness.FIRM -> settings.unlockMinutesFirm
      Strictness.LOCKED -> null
    }
  }
}

/** Everything the tracker needs to read and write; the store implements it. */
interface TrackerState {
  val locks: Map<String, Lock>
  val focus: FocusSession?
  fun counters(day: String, key: String): Counters
  fun setCounters(day: String, key: String, c: Counters)
  fun unlockUntil(key: String): Long?
}

/**
 * Follows the foreground target and keeps today's counters (§4.1). Pure: the service feeds it
 * events with timestamps, it answers with a decision for the target now in front.
 *
 * Time counts only while the screen is interactive. Opens count on arrival unless the target
 * was away 30 s or less, or it is coming back from the pause screen after an unlock.
 */
class Tracker(private val state: TrackerState, private val dayOf: (Long) -> String) {
  /** Target in front (null = launcher, our app, or a non-target). */
  var current: String? = null
    private set
  private var since: Long? = null
  private var screenOn = true

  /** A new window is in front. `key` = its target key, or null when it isn't a target. */
  fun onForeground(key: String?, now: Long, fromPause: Boolean = false): Decision? {
    if (key == current) return key?.let { evaluate(it, now) }
    flush(now)
    current?.let { leaving ->
      val day = dayOf(now)
      state.setCounters(day, leaving, state.counters(day, leaving).copy(lastLeftAt = now))
    }
    current = key
    since = if (screenOn) now else null
    if (key == null) return null
    if (!state.locks.containsKey(key) && state.focus?.targetKeys?.contains(key) != true) return null
    val day = dayOf(now)
    val c = state.counters(day, key)
    if (!fromPause && EnforcementEngine.isNewOpen(c.lastLeftAt, now)) {
      state.setCounters(day, key, c.copy(opens = c.opens + 1))
    }
    return evaluate(key, now)
  }

  /** Re-check without a window change (scheduled `nextCheckAt`, unlock ended, 15 s tick). */
  fun onTick(now: Long): Decision? {
    val key = current ?: return null
    flush(now)
    val d = evaluate(key, now)
    return if (d is Decision.Block && d.reason == BlockReason.TIME) Decision.Block(BlockReason.TIME_UP) else d
  }

  fun onScreenOff(now: Long) {
    flush(now)
    screenOn = false
    since = null
  }

  fun onScreenOn(now: Long): Decision? {
    screenOn = true
    since = now
    return current?.let { evaluate(it, now) }
  }

  /** Adds the time since the last flush to the current target, split at midnight. */
  fun flush(now: Long) {
    val key = current
    val start = since
    if (key == null || start == null || !screenOn || now <= start) {
      if (screenOn && key != null) since = now
      return
    }
    if (state.locks.containsKey(key)) {
      val startDay = dayOf(start)
      val endDay = dayOf(now)
      // An app in front at midnight starts the new day with 0 used (§4.1): only the time
      // before the date changed is added, to the old day.
      val add = if (startDay == endDay) now - start else 0L
      if (add > 0) {
        val c = state.counters(startDay, key)
        state.setCounters(startDay, key, c.copy(usedMs = c.usedMs + add))
      }
    }
    since = now
  }

  private fun evaluate(key: String, now: Long): Decision = EnforcementEngine.decide(
    targetKey = key,
    now = now,
    locks = state.locks,
    counters = state.counters(dayOf(now), key),
    unlockUntil = state.unlockUntil(key),
    focus = state.focus,
  )
}
