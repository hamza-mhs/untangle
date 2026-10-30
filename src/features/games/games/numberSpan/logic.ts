import { randInt, rng } from '@/lib/rng';

export const SPAN_SECONDS = 45;
export const SPAN_LIVES = 3;
export const SPAN_START = 4;
export const SPAN_MAX = 6;
export const SPAN_ON_MS = 620;
export const SPAN_GAP_MS = 140;
export const SPAN_DIGIT_POINTS = 10;
export const SPAN_PERFECT_POINTS = 30;

/** A stream of digit strings; every attempt (also a retry) gets fresh digits. */
export function spanStream(seed: number) {
  const rand = rng(seed);
  return (len: number) => Array.from({ length: len }, () => randInt(rand, 10));
}

/** Per-digit marks for a typed answer: true where it matches. */
export function spanMarks(target: readonly number[], typed: readonly number[]): boolean[] {
  return target.map((d, i) => typed[i] === d);
}

export function spanStars(longest: number): 1 | 2 | 3 {
  return longest >= SPAN_MAX ? 3 : longest >= 5 ? 2 : 1;
}
