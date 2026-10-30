import { rng, shuffle } from '@/lib/rng';

export type Dir = 'left' | 'right';
export type ArrowTrial = { middle: Dir; flank: Dir };
export const ARROW_TRIALS = 20;

/** Half congruent, half incongruent flankers, shuffled. */
export function arrowTrials(seed: number, n = ARROW_TRIALS): ArrowTrial[] {
  const rand = rng(seed);
  const base = Array.from({ length: n }, (_, i) => {
    const middle: Dir = rand() < 0.5 ? 'left' : 'right';
    const flank: Dir = i % 2 === 0 ? middle : middle === 'left' ? 'right' : 'left';
    return { middle, flank };
  });
  return shuffle(base, rand);
}

export function averageMs(times: readonly number[]): number {
  return times.length ? Math.round(times.reduce((s, x) => s + x, 0) / times.length) : 0;
}

export function arrowStars(right: number): 1 | 2 | 3 {
  return right >= 15 ? 3 : right >= 8 ? 2 : 1;
}
