import { rng, shuffle } from '@/lib/rng';

export const LANES = 3;
export type LaneItem = { at: number; lane: number; kind: 'block' | 'gem' };

/**
 * Rows of falling things for a 30 s round, closer together as it speeds up. A row never blocks
 * all three lanes, so there is always a way through.
 */
export function laneSchedule(seed: number, durationMs = 30_000): LaneItem[] {
  const rand = rng(seed);
  const items: LaneItem[] = [];
  let at = 900;
  while (at < durationMs - 600) {
    const blocks = rand() < 0.35 ? 2 : 1;
    const lanes = shuffle([0, 1, 2], rand);
    for (let i = 0; i < blocks; i++) items.push({ at, lane: lanes[i]!, kind: 'block' });
    if (rand() < 0.6) items.push({ at, lane: lanes[2]!, kind: 'gem' });
    at += Math.round(Math.max(420, 900 - (at / durationMs) * 480) + rand() * 120);
  }
  return items;
}

/** Fall time from top to the runner, shorter as the round goes on. */
export function fallMs(atMs: number, durationMs = 30_000): number {
  return Math.round(1700 - (atMs / durationMs) * 700);
}

export function laneStars(hits: number): 1 | 2 | 3 {
  return hits === 0 ? 3 : hits < 3 ? 2 : 1;
}
