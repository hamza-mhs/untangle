import { sortPieces } from '../../kit/sortRules';

export const FLIP_PIECES = 16;
export const FLIP_SECONDS = 40;
/** The rule flips before the 7th and the 13th piece (prototype n === 7 || n === 13). */
export const FLIP_AT = [6, 12] as const;
export const FLIP_PAUSE_MS = 1100;

export function flipPieces(seed: number) {
  return sortPieces(seed, FLIP_PIECES, FLIP_AT);
}

/** 10 points, +2 for every answer in a streak after the first. */
export function flipPoints(streak: number): number {
  return 10 + Math.max(0, streak - 1) * 2;
}

export function flipStars(right: number): 1 | 2 | 3 {
  return right >= 14 ? 3 : right >= 10 ? 2 : 1;
}
