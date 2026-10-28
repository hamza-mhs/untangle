import { addDays, type DayKey } from '@/lib/time';

/**
 * Clarity — a *habit score* (0–100). It is not a health or cognitive measure.
 * Copy rule: never "heal / cure / repair / rewire your brain".
 *
 * Exponentially-weighted mean of daily completion (challenges done / 3, capped at 1) over the
 * last WINDOW days, most recent day weighted highest. Days before the user started are ignored.
 * TODO(verify): confirm formula with product.
 */

export const CLARITY_WINDOW = 14;
export const CLARITY_DECAY = 0.85;
export const CHALLENGES_PER_DAY = 3;

export function clarityScore(args: {
  completedByDay: Readonly<Record<DayKey, number>>;
  today: DayKey;
  firstDay: DayKey;
}): number {
  const { completedByDay, today, firstDay } = args;
  let weighted = 0;
  let weights = 0;
  for (let i = 0; i < CLARITY_WINDOW; i++) {
    const day = addDays(today, -i);
    if (day < firstDay) break;
    const w = CLARITY_DECAY ** i;
    const ratio = Math.min(1, (completedByDay[day] ?? 0) / CHALLENGES_PER_DAY);
    weighted += w * ratio;
    weights += w;
  }
  return weights === 0 ? 0 : Math.round((weighted / weights) * 100);
}
