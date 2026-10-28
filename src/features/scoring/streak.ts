import { addDays, daysBetween, type DayKey } from '@/lib/time';

/**
 * Streaks: a day counts if ≥1 challenge was completed. A missed day can be covered by a streak
 * freeze (if the user has one), which keeps the streak alive without adding to it.
 */

export type StreakInput = {
  /** Challenges completed per day. */
  completedByDay: Readonly<Record<DayKey, number>>;
  /** Days covered by a freeze. */
  frozenDays: ReadonlySet<DayKey>;
  today: DayKey;
};

export function dayCounts(completed: number | undefined): boolean {
  return (completed ?? 0) >= 1;
}

export function computeStreak({ completedByDay, frozenDays, today }: StreakInput): number {
  let streak = dayCounts(completedByDay[today]) ? 1 : 0;
  // Today isn't over, so an empty today doesn't break the streak.
  let day = addDays(today, -1);
  for (let guard = 0; guard < 10_000; guard++) {
    if (dayCounts(completedByDay[day])) streak += 1;
    else if (!frozenDays.has(day)) break;
    day = addDays(day, -1);
  }
  return streak;
}

/**
 * Run once per app open: walks the missed days between `lastSettled` and yesterday and spends
 * freezes to cover them (oldest first). Returns the newly frozen days and remaining freezes.
 */
export function settleMissedDays(args: {
  lastSettled: DayKey;
  today: DayKey;
  completedByDay: Readonly<Record<DayKey, number>>;
  freezes: number;
}): { frozen: DayKey[]; freezesLeft: number } {
  const { lastSettled, today, completedByDay } = args;
  let freezesLeft = args.freezes;
  const frozen: DayKey[] = [];
  const span = daysBetween(lastSettled, today);
  for (let i = 1; i < span; i++) {
    const day = addDays(lastSettled, i);
    if (dayCounts(completedByDay[day])) continue;
    if (freezesLeft <= 0) break;
    frozen.push(day);
    freezesLeft -= 1;
  }
  return { frozen, freezesLeft };
}
