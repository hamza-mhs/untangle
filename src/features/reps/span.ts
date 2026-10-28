import type { Rng } from './rng';

/** Number span: show a digit sequence, user repeats it; length grows on success. */

export type SpanRound = { digits: number[] };

/** No digit repeats back-to-back, which makes sequences easier to read aloud. */
export function generateSpan(rng: Rng, length: number): SpanRound {
  const digits: number[] = [];
  while (digits.length < length) {
    const d = rng.int(0, 9);
    if (d !== digits[digits.length - 1]) digits.push(d);
  }
  return { digits };
}

export function checkSpan(round: SpanRound, answer: readonly number[]): boolean {
  return round.digits.length === answer.length && round.digits.every((d, i) => d === answer[i]);
}

/** Classic adaptive rule: +1 after a success, −1 after two misses in a row (min 3). */
export function nextSpanLength(current: number, success: boolean, missStreak: number): number {
  if (success) return current + 1;
  return missStreak >= 2 ? Math.max(3, current - 1) : current;
}
