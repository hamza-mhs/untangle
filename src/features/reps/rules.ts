/**
 * Rep rules (pack 2 SPEC §3), pure: one counted round a day, one retry after a time-up, points
 * only inside the time, and the difficulty ladder.
 */

export const RETRIES_PER_DAY = 1;
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 3;

export type RoundRecord = {
  /** Starts today (1 = first try, 2 = the retry). */
  attempts: number;
  won: boolean;
  elapsedMs: number | null;
};

export type RoundAccess =
  /** Not played yet today. */
  | { kind: 'fresh' }
  /** Lost on time; the one retry is still there. */
  | { kind: 'retry' }
  /** Won today, or lost the retry: R7 / FTimeUp without retry. */
  | { kind: 'doneToday'; won: boolean };

export function roundAccess(record: RoundRecord | null): RoundAccess {
  if (!record) return { kind: 'fresh' };
  if (record.won) return { kind: 'doneToday', won: true };
  // A lost (or abandoned) first try leaves the one retry; after that, done for today.
  return record.attempts <= RETRIES_PER_DAY ? { kind: 'retry' } : { kind: 'doneToday', won: false };
}

export function retriesLeft(record: RoundRecord | null): number {
  if (!record || record.won) return 0;
  return Math.max(0, RETRIES_PER_DAY + 1 - record.attempts);
}

/** Up one after a win, down one after two losses in a row. */
export function nextLevel(level: number, won: boolean, lossStreak: number): number {
  if (won) return Math.min(MAX_LEVEL, level + 1);
  if (lossStreak >= 2) return Math.max(MIN_LEVEL, level - 1);
  return level;
}

/** Points for a round: full points inside the time, nothing on time-up. */
export function roundPoints(points: number, won: boolean): number {
  return won ? points : 0;
}
