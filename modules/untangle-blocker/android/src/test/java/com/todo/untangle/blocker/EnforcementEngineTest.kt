package com.todo.untangle.blocker

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

private const val MIN = 60_000L

private fun lock(
  key: String = "app:com.instagram.android",
  minutes: Int? = 30,
  opens: Int? = null,
  strictness: Strictness = Strictness.GENTLE,
  enabled: Boolean = true,
) = Lock("id-$key", key, "Instagram", minutes, opens, strictness, enabled, 0L)

/** In-memory TrackerState for tests. */
private class FakeState(locks: List<Lock>) : TrackerState {
  override var locks: Map<String, Lock> = locks.associateBy { it.targetKey }
  override var focus: FocusSession? = null
  val days = mutableMapOf<String, MutableMap<String, Counters>>()
  val unlocks = mutableMapOf<String, Long>()
  override fun counters(day: String, key: String) = days[day]?.get(key) ?: Counters()
  override fun setCounters(day: String, key: String, c: Counters) {
    days.getOrPut(day) { mutableMapOf() }[key] = c
  }
  override fun unlockUntil(key: String) = unlocks[key]
}

/** Day = whole days since 0, so midnight is every 24 h. */
private val day: (Long) -> String = { (it / (24 * 60 * MIN)).toString() }

class EnforcementEngineTest {
  private val ig = "app:com.instagram.android"

  @Test fun `no lock or a disabled lock allows`() {
    assertEquals(Decision.Allow(null), EnforcementEngine.decide("app:x", 0, emptyMap(), Counters(), null, null))
    val off = mapOf(ig to lock(enabled = false))
    assertEquals(Decision.Allow(null), EnforcementEngine.decide(ig, 0, off, Counters(opens = 99), null, null))
  }

  @Test fun `focus session wins over everything`() {
    val focus = FocusSession(endAt = 10 * MIN, targetKeys = setOf(ig))
    val d = EnforcementEngine.decide(ig, 0, mapOf(ig to lock(minutes = null, opens = 50)), Counters(), 999 * MIN, focus)
    assertEquals(Decision.Block(BlockReason.FOCUS), d)
  }

  @Test fun `an ended focus session does nothing`() {
    val focus = FocusSession(endAt = 10 * MIN, targetKeys = setOf(ig))
    assertEquals(Decision.Allow(null), EnforcementEngine.decide(ig, 11 * MIN, emptyMap(), Counters(), null, focus))
  }

  @Test fun `an active unlock allows until it ends`() {
    val d = EnforcementEngine.decide(ig, 0, mapOf(ig to lock(minutes = 0)), Counters(), 5 * MIN, null)
    assertEquals(Decision.Allow(5 * MIN), d)
  }

  @Test fun `zero minutes blocks all day`() {
    assertEquals(Decision.Block(BlockReason.ALWAYS), EnforcementEngine.decide(ig, 0, mapOf(ig to lock(minutes = 0)), Counters(), null, null))
  }

  @Test fun `the open that goes over the limit is blocked`() {
    val locks = mapOf(ig to lock(minutes = null, opens = 3))
    assertEquals(Decision.Allow(null), EnforcementEngine.decide(ig, 0, locks, Counters(opens = 3), null, null))
    assertEquals(Decision.Block(BlockReason.OPENS), EnforcementEngine.decide(ig, 0, locks, Counters(opens = 4), null, null))
  }

  @Test fun `time allowance re-checks exactly when it runs out`() {
    val locks = mapOf(ig to lock(minutes = 30))
    assertEquals(Decision.Allow(1000 + 20 * MIN), EnforcementEngine.decide(ig, 1000, locks, Counters(usedMs = 10 * MIN), null, null))
    assertEquals(Decision.Block(BlockReason.TIME), EnforcementEngine.decide(ig, 0, locks, Counters(usedMs = 30 * MIN), null, null))
  }

  @Test fun `opens trip before time on arrival`() {
    val locks = mapOf(ig to lock(minutes = 30, opens = 2))
    assertEquals(Decision.Block(BlockReason.OPENS), EnforcementEngine.decide(ig, 0, locks, Counters(usedMs = 40 * MIN, opens = 3), null, null))
  }

  @Test fun `same open within 30 s`() {
    assertTrue(EnforcementEngine.isNewOpen(null, 0))
    assertFalse(EnforcementEngine.isNewOpen(0, 30_000))
    assertTrue(EnforcementEngine.isNewOpen(0, 30_001))
  }

  @Test fun `unlock length and caps per strictness`() {
    val s = BlockerSettings(unlockMinutesGentle = 5, unlockMinutesFirm = 3)
    assertEquals(5, EnforcementEngine.unlockMinutes(lock(strictness = Strictness.GENTLE), Counters(unlocksUsed = 2), s))
    assertNull(EnforcementEngine.unlockMinutes(lock(strictness = Strictness.GENTLE), Counters(unlocksUsed = 3), s))
    assertEquals(3, EnforcementEngine.unlockMinutes(lock(strictness = Strictness.FIRM), Counters(unlocksUsed = 1), s))
    assertNull(EnforcementEngine.unlockMinutes(lock(strictness = Strictness.FIRM), Counters(unlocksUsed = 2), s))
    assertNull(EnforcementEngine.unlockMinutes(lock(strictness = Strictness.LOCKED), Counters(), s))
  }
}

class TrackerTest {
  private val ig = "app:com.instagram.android"

  @Test fun `counts time while in front and blocks when it runs out`() {
    val st = FakeState(listOf(lock(minutes = 1)))
    val t = Tracker(st, day)
    assertEquals(Decision.Allow(MIN), t.onForeground(ig, 0))
    assertEquals(1, st.counters("0", ig).opens)
    assertEquals(Decision.Allow(MIN), t.onTick(30_000))
    assertEquals(30_000, st.counters("0", ig).usedMs)
    assertEquals(Decision.Block(BlockReason.TIME_UP), t.onTick(MIN))
  }

  @Test fun `leaving for 30 s or less is the same open`() {
    val st = FakeState(listOf(lock(minutes = 30)))
    val t = Tracker(st, day)
    t.onForeground(ig, 0)
    t.onForeground(null, 10_000)
    t.onForeground(ig, 35_000)
    assertEquals(1, st.counters("0", ig).opens)
    t.onForeground(null, 40_000)
    t.onForeground(ig, 80_000)
    assertEquals(2, st.counters("0", ig).opens)
  }

  @Test fun `time stops while the screen is off`() {
    val st = FakeState(listOf(lock(minutes = 30)))
    val t = Tracker(st, day)
    t.onForeground(ig, 0)
    t.onScreenOff(10_000)
    t.onScreenOn(5 * MIN)
    t.onTick(5 * MIN + 20_000)
    assertEquals(30_000, st.counters("0", ig).usedMs)
  }

  @Test fun `coming back after an unlock is not a new open`() {
    val st = FakeState(listOf(lock(minutes = 0)))
    val t = Tracker(st, day)
    assertEquals(Decision.Block(BlockReason.ALWAYS), t.onForeground(ig, 0))
    t.onForeground(null, 1000)
    st.unlocks[ig] = 5 * MIN + 2 * MIN
    assertEquals(Decision.Allow(7 * MIN), t.onForeground(ig, 5 * MIN, fromPause = true))
    assertEquals(1, st.counters("0", ig).opens)
  }

  @Test fun `untargeted apps are not counted`() {
    val st = FakeState(listOf(lock()))
    val t = Tracker(st, day)
    assertNull(t.onForeground("app:com.whatsapp", 0))
    assertTrue(st.days.isEmpty())
  }

  @Test fun `a new day starts from zero`() {
    val dayMs = 24 * 60 * MIN
    val st = FakeState(listOf(lock(minutes = 30)))
    val t = Tracker(st, day)
    t.onForeground(ig, dayMs - 10 * MIN)
    t.onTick(dayMs - MIN)
    assertEquals(9 * MIN, st.counters("0", ig).usedMs)
    t.onTick(dayMs + MIN)
    assertEquals(0, st.counters("1", ig).usedMs)
    t.onTick(dayMs + 2 * MIN)
    assertEquals(MIN, st.counters("1", ig).usedMs)
  }
}

class DomainsTest {
  @Test fun `registrable domains`() {
    assertEquals("reddit.com", Domains.registrable("https://www.reddit.com/r/all"))
    assertEquals("reddit.com", Domains.registrable("old.reddit.com"))
    assertEquals("reddit.com", Domains.registrable("m.reddit.com/r/x"))
    assertEquals("bbc.co.uk", Domains.registrable("bbc.co.uk/news"))
    assertNull(Domains.registrable("Search or type web address"))
    assertNull(Domains.registrable("localhost"))
    assertNull(Domains.registrable(null))
  }
}
