import type { ShieldEvent, UsageSummary } from '@/services/blocking';

import { percentChange } from './homeState';

/**
 * Home's four stats (SPEC §5 Home › Data sources). Longest focus and opens resisted are our
 * own data and work everywhere. Screen time and pickups: Android computes them from
 * UsageStatsManager; on iOS they can only be *displayed* by a DeviceActivityReport view, so
 * the app never has the numbers (the cards are native views there).
 */

export type FocusSample = { endedAt: number; minutes: number; isTimerOnly: boolean };

const DAY = 24 * 60 * 60 * 1000;

/** Longest locked session in the last 7 days, and the change vs the first week. */
export function longestFocusStat(
  sessions: readonly FocusSample[],
  firstUseAt: number | null,
  now: number,
): { minutes: number; deltaPercent: number | null } {
  const locked = sessions.filter((s) => !s.isTimerOnly);
  const recent = locked.filter((s) => now - s.endedAt < 7 * DAY);
  const minutes = recent.length ? Math.max(...recent.map((s) => s.minutes)) : 0;
  if (firstUseAt === null) return { minutes, deltaPercent: null };
  const firstWeek = locked.filter((s) => s.endedAt - firstUseAt < 7 * DAY);
  const base = firstWeek.length ? Math.max(...firstWeek.map((s) => s.minutes)) : null;
  return { minutes, deltaPercent: percentChange(minutes, base) };
}

/** Shields closed today, and the share of today's shield appearances that ended closed. */
export function opensResistedStat(
  events: readonly ShieldEvent[],
  dayStartAt: number,
): { closed: number; percent: number | null } {
  const today = events.filter((e) => e.at >= dayStartAt);
  const closed = today.filter((e) => e.outcome === 'closed').length;
  return { closed, percent: today.length ? Math.round((closed / today.length) * 100) : null };
}

/** Android: today vs yesterday (screen time) and vs the first week (pickups). */
export function usageStats(
  today: UsageSummary | null,
  yesterday: UsageSummary | null,
  firstWeekPickups: number | null,
): {
  screenTimeMinutes: number | null;
  screenTimeDelta: number | null;
  pickups: number | null;
  pickupsDeltaPercent: number | null;
} {
  return {
    screenTimeMinutes: today?.screenTimeMinutes ?? null,
    screenTimeDelta:
      today && yesterday ? today.screenTimeMinutes - yesterday.screenTimeMinutes : null,
    pickups: today?.pickups ?? null,
    pickupsDeltaPercent: today ? percentChange(today.pickups, firstWeekPickups) : null,
  };
}

/** Lower screen time / pickups is good (green); higher focus / resisted is good. */
export function deltaTone(
  delta: number | null,
  isLowerBetter: boolean,
): 'success' | 'warning' | 'muted' {
  if (delta === null || delta === 0) return 'muted';
  return delta < 0 === isLowerBetter ? 'success' : 'warning';
}
