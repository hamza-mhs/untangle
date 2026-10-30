import { rng } from '@/lib/rng';

export const ORBIT_SECONDS = 30;
export const ORBIT_LIVES = 3;
/** The prototype field (px) and its two rings. */
export const ORBIT = {
  w: 264,
  h: 340,
  cx: 132,
  cy: 170,
  inner: 62,
  outer: 106,
  track: 22,
} as const;
/** Starting speed (rad/s) and the boost per lap. */
export const ORBIT_SPEED = 1.9;
export const ORBIT_SPEED_UP = 0.12;
/** Half-width of a red block (rad) and how close counts as picking up a spark. */
export const BLOCK_HALF = 0.28;
export const SPARK_REACH = 0.12;
export const BUMP_COOL_MS = 700;
export const LAP_POINTS = 20;
export const SPARK_POINTS = 10;
export const START_ANGLE = -Math.PI / 2;

/** 0 = inner ring, 1 = outer ring. */
export type Ring = 0 | 1;
/**
 * The marble starts on the inner ring. The prototype (a self-playing demo) starts outer, which
 * meets the first block ~0.5 s after the board appears; inner leaves time to read the board.
 */
export const START_RING: Ring = 0;
export type Block = { ring: Ring; a: number };
export type Spark = { ring: Ring; a: number };

/**
 * One lap's layout: `min(4, 2 + laps)` blocks alternating rings (so there is always a way
 * through), each with a spark on the other ring at the same angle. The first block sits
 * 1.3 rad past the start so the opening is free.
 */
export function lapLayout(seed: number, laps: number): { blocks: Block[]; sparks: Spark[] } {
  const rand = rng(seed * 101 + laps);
  const n = Math.min(4, 2 + laps);
  const blocks = Array.from({ length: n }, (_, i): Block => ({
    ring: ((i + 1) % 2) as Ring,
    a: START_ANGLE + 1.3 + ((Math.PI * 2 - 1.8) * i) / n + (rand() - 0.5) * 0.2,
  }));
  return { blocks, sparks: blocks.map((b) => ({ ring: (1 - b.ring) as Ring, a: b.a })) };
}

/** Smallest signed difference between two angles, in (−π, π]. */
export function angleDiff(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

export function hitsBlock(ang: number, ring: Ring, blocks: readonly Block[]): boolean {
  return blocks.some((b) => b.ring === ring && Math.abs(angleDiff(ang, b.a)) < BLOCK_HALF);
}

export function orbitStars(bumps: number, livesLeft: number): 1 | 2 | 3 {
  return bumps === 0 ? 3 : livesLeft > 0 ? 2 : 1;
}
