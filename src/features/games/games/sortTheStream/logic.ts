import { sortPieces } from '../../kit/sortRules';

export const STREAM_CARDS = 20;
export const STREAM_SECONDS = 40;
/** One switch, colour → shape, before the 9th card (prototype n === 9). */
export const STREAM_SWITCH = [8] as const;
export const STREAM_PAUSE_MS = 1000;

export function streamCards(seed: number) {
  return sortPieces(seed, STREAM_CARDS, STREAM_SWITCH);
}

/** 8 points plus the current streak (prototype `8 + st`). */
export function streamPoints(streak: number): number {
  return 8 + streak;
}

export function streamStars(right: number): 1 | 2 | 3 {
  return right >= 19 ? 3 : right >= 14 ? 2 : 1;
}
