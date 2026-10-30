import { addDays, type DayKey } from '@/lib/time';

/**
 * Streak rules (20-phase2-core-app §2): a day counts when completed games + detours that chose
 * "back" or "breath" reach the daily goal. The streak is the run of counted days ending today
 * or yesterday (today not counted yet does not break it). No freezes in v1.
 */
export type DayActivity = { games: number; detours: number };

export function dayMeetsGoal(a: DayActivity | undefined, goal: number): boolean {
  return !!a && a.games + a.detours >= goal;
}

export function computeStreak(
  byDay: Readonly<Record<DayKey, DayActivity>>,
  today: DayKey,
  goal: number,
): number {
  let day = dayMeetsGoal(byDay[today], goal) ? today : addDays(today, -1);
  let n = 0;
  for (let guard = 0; guard < 3650 && dayMeetsGoal(byDay[day], goal); guard++) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/** The week row on the streak sheet: Monday … Sunday of the current week. */
export function weekDays(today: DayKey): DayKey[] {
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7; // 0 = Monday
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - dow));
}

/** "about N min" for the training header. */
export function aboutMinutes(seconds: readonly number[]): number {
  return Math.max(1, Math.round(seconds.reduce((s, x) => s + x, 0) / 60));
}

/**
 * "Usual": the average over the previous 7 full days that have data; null with fewer than 3
 * such days (02-android-platform §5).
 */
export function usualOf(values: readonly (number | null | undefined)[]): number | null {
  const have = values.filter((v): v is number => typeof v === 'number');
  if (have.length < 3) return null;
  return have.reduce((s, v) => s + v, 0) / have.length;
}
