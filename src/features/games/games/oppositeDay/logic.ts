import { pick, rng } from '@/lib/rng';

import type { ArrowDir } from '../../kit';

export const OPP_TRIALS = 14;
export const OPP_SECONDS = 40;
export const DIRS: readonly ArrowDir[] = ['up', 'right', 'down', 'left'];
export const OPPOSITE: Record<ArrowDir, ArrowDir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

/** 14 arrows; the same direction never shows twice in a row. */
export function oppTrials(seed: number): ArrowDir[] {
  const rand = rng(seed);
  const out: ArrowDir[] = [];
  for (let i = 0; i < OPP_TRIALS; i++) {
    const last = out[i - 1];
    out.push(pick(last ? DIRS.filter((d) => d !== last) : DIRS, rand));
  }
  return out;
}

/** 10 points, +3 for every answer in a streak after the first. */
export function oppPoints(streak: number): number {
  return 10 + Math.max(0, streak - 1) * 3;
}

export function oppStars(right: number): 1 | 2 | 3 {
  return right >= 13 ? 3 : right >= 9 ? 2 : 1;
}
