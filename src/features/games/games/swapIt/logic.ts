import { randInt, rng } from '@/lib/rng';

export const SWAP_ROUNDS = 5;
export const SWAP_SECONDS = 40;
export const SWAP_CARDS = 3;
/** The card that hides the star (prototype: the middle card). */
export const STAR_CARD = 1;
export const SWAP_SHOW_MS = 900;

/** Swap duration for round r (1-based): 395, 350, … ms, never under 240. */
export function swapMs(r: number): number {
  return Math.max(240, 440 - r * 45);
}

/** Points for finding the star in round r. */
export function swapPoints(r: number): number {
  return 20 + r * 5;
}

/** One swap: the two slots (0–2) whose cards trade places. */
export type Swap = readonly [number, number];

/** 2 + r swaps per round, each between two different slots. */
export function swapRounds(seed: number, rounds = SWAP_ROUNDS): Swap[][] {
  const rand = rng(seed);
  return Array.from({ length: rounds }, (_, i) =>
    Array.from({ length: 2 + (i + 1) }, (): Swap => {
      const a = randInt(rand, SWAP_CARDS);
      const b = (a + 1 + randInt(rand, SWAP_CARDS - 1)) % SWAP_CARDS;
      return [a, b];
    }),
  );
}

/** slotOf[card] after the swaps. */
export function applySwaps(slotOf: readonly number[], swaps: readonly Swap[]): number[] {
  const s = [...slotOf];
  for (const [a, b] of swaps) {
    const ca = s.indexOf(a);
    const cb = s.indexOf(b);
    s[ca] = b;
    s[cb] = a;
  }
  return s;
}

export function swapStars(found: number, misses: number): 1 | 2 | 3 {
  return misses === 0 ? 3 : found >= 3 ? 2 : 1;
}
