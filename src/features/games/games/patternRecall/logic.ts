import { randInt, rng } from '@/lib/rng';

export const PATTERN_ROUNDS = 5;
export const PATTERN_SECONDS = 32;
export const PATTERN_LIVES = 3;
export const PATTERN_ON_MS = 420;
export const PATTERN_GAP_MS = 170;
export const PATTERN_PAD_POINTS = 10;
export const PATTERN_PERFECT_POINTS = 30;
/** The prototype's nine pads, in order. */
export const PADS = [
  'pink',
  'mint',
  'sun',
  'sky',
  'violet',
  'orange',
  'cobalt',
  'coral',
  'mint',
] as const;

/** Pattern length for round r (1-based): 3, 4, … 7. */
export function patternLength(r: number): number {
  return r + 2;
}

/**
 * A stream of patterns: every attempt (also a retry after a mistake) gets a fresh pattern of the
 * round's length, so the n-th call is the same for the same seed.
 */
export function patternStream(seed: number) {
  const rand = rng(seed);
  return (r: number) => Array.from({ length: patternLength(r) }, () => randInt(rand, PADS.length));
}

export function patternStars(roundsCleared: number): 1 | 2 | 3 {
  return roundsCleared >= PATTERN_ROUNDS ? 3 : roundsCleared >= 3 ? 2 : 1;
}
