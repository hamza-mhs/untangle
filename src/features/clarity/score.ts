import { hoursPerDay } from '@/features/onboarding/logic/yearMath';
import type { ScreenTimeBucket, WhenTrigger } from '@/features/onboarding/types';

/**
 * Starting Clarity (OB13). DECIDED: "hours + triggers" —
 *   55 − 3 × (OB02 hours midpoint) − 2 × (number of OB04 answers), clamped to 30–55,
 * so it always lands low enough to visibly rise. Computed once and then fixed.
 */
export const STARTING_CLARITY_MAX = 55;
export const STARTING_CLARITY_MIN = 30;
const PER_HOUR = 3;
const PER_TRIGGER = 2;

export function startingClarity(answers: {
  screenTime: ScreenTimeBucket | null;
  when: readonly WhenTrigger[];
}): number {
  const raw =
    STARTING_CLARITY_MAX -
    PER_HOUR * hoursPerDay(answers.screenTime) -
    PER_TRIGGER * answers.when.length;
  return Math.round(Math.min(STARTING_CLARITY_MAX, Math.max(STARTING_CLARITY_MIN, raw)));
}

/**
 * Clarity after onboarding: the starting score, rising toward 100 with the habit score
 * (features/scoring/clarity: weighted challenge completion, 0–100).
 *   clarity = start + (100 − start) × habit / 100
 * With no history yet it is exactly the starting score, so Home day 1 shows OB13's number.
 */
export function currentClarity(start: number | null, habit: number | null): number {
  const base = start ?? STARTING_CLARITY_MIN;
  if (habit === null) return base;
  const h = Math.min(100, Math.max(0, habit));
  return Math.round(base + ((100 - base) * h) / 100);
}
