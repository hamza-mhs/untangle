import { randInt, rng } from '@/lib/rng';

export const TOTAL_TRIALS = 12;
export const TOTAL_SECONDS = 40;
/** The bar under the stacks runs out after this (prototype 3.5 s). */
export const TOTAL_BAR_MS = 3500;

export type TotalTrial = { stacks: [number[], number[]]; sums: [number, number]; bigger: 0 | 1 };

const sum = (a: readonly number[]) => a.reduce((x, y) => x + y, 0);

/** Two stacks of three 1–9 tiles; ties are nudged apart as in the prototype. */
export function totalTrials(seed: number, n = TOTAL_TRIALS): TotalTrial[] {
  const rand = rng(seed);
  return Array.from({ length: n }, () => {
    const a = Array.from({ length: 3 }, () => 1 + randInt(rand, 9));
    const b = Array.from({ length: 3 }, () => 1 + randInt(rand, 9));
    if (sum(a) === sum(b)) b[0] = b[0] === 9 ? 8 : b[0]! + 1;
    const sa = sum(a);
    const sb = sum(b);
    return { stacks: [a, b], sums: [sa, sb], bigger: sa > sb ? 0 : 1 };
  });
}

export function totalPoints(streak: number): number {
  return 10 + streak;
}

export function totalStars(right: number): 1 | 2 | 3 {
  return right >= 11 ? 3 : right >= 8 ? 2 : 1;
}
