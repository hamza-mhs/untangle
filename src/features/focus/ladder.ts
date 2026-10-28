/**
 * The attention ladder (FFocusDone): each completed, locked session moves the next suggested
 * length up one step. 25 → 80 min in 5-min steps, 12 rungs.
 */
export const LADDER_START = 25;
export const LADDER_STEP = 5;
export const LADDER_RUNGS = 12;
export const LADDER_MAX = LADDER_START + LADDER_STEP * (LADDER_RUNGS - 1);

/** Rung (1-based) reached by a session of `minutes`. */
export function rungFor(minutes: number): number {
  const r = Math.floor((minutes - LADDER_START) / LADDER_STEP) + 1;
  return Math.min(LADDER_RUNGS, Math.max(1, r));
}

/** Next suggested session after the longest completed one. */
export function nextSessionMinutes(longestCompleted: number | null): number {
  if (longestCompleted === null) return LADDER_START;
  return Math.min(LADDER_MAX, Math.max(LADDER_START, longestCompleted + LADDER_STEP));
}

/** FFocusStart default chip: the largest chip not above the ladder's next step. */
export function defaultChip(next: number, chips: readonly number[]): number {
  const fitting = chips.filter((c) => c <= next);
  return fitting.length ? Math.max(...fitting) : (chips[0] ?? LADDER_START);
}
