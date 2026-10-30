package com.todo.untangle.blocker

/**
 * Plain data shared by the engine, the store and the bridge. No Android types, so the engine
 * can be unit-tested on the JVM.
 */

enum class Strictness { GENTLE, FIRM, LOCKED;
  companion object {
    fun parse(s: String?): Strictness = when (s) {
      "firm" -> FIRM
      "locked" -> LOCKED
      else -> GENTLE
    }
  }
  fun js(): String = name.lowercase()
}

/** One lock = one target (`app:<package>` or `site:<domain>`). Mirrors src/features/locks/types.ts. */
data class Lock(
  val id: String,
  val targetKey: String,
  /** App label or domain. */
  val label: String,
  /** null = no time limit; 0 = blocked all day. */
  val dailyMinutes: Int?,
  /** null = no open limit. */
  val dailyOpens: Int?,
  val strictness: Strictness,
  val enabled: Boolean,
  val createdAt: Long,
)

data class BlockerSettings(
  val unlockMinutesGentle: Int = 5,
  val unlockMinutesFirm: Int = 3,
  val firmWaitSeconds: Int = 30,
)

data class FocusSession(val endAt: Long, val targetKeys: Set<String>)

/** Today's numbers for one target. */
data class Counters(
  val usedMs: Long = 0,
  val opens: Int = 0,
  val unlocksUsed: Int = 0,
  /** When the target last left the foreground (for the 30 s "same open" rule). */
  val lastLeftAt: Long? = null,
)

enum class BlockReason { FOCUS, ALWAYS, OPENS, TIME, TIME_UP }

sealed class Decision {
  /** `nextCheckAt` = when the allowance runs out (or an unlock ends); null = never. */
  data class Allow(val nextCheckAt: Long?) : Decision()
  data class Block(val reason: BlockReason) : Decision()
}

/** Unlock caps per day (02-android-platform §4.6). */
fun unlockCap(s: Strictness): Int = when (s) {
  Strictness.GENTLE -> 3
  Strictness.FIRM -> 2
  Strictness.LOCKED -> 0
}

fun appKey(packageName: String) = "app:$packageName"
fun siteKey(domain: String) = "site:$domain"
