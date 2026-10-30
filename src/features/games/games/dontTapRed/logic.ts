import { pick, rng, shuffle } from '@/lib/rng';

export const TAP_COLS = 3;
export const TAP_ROWS = 4;
export type Pop = { at: number; cell: number; red: boolean; ttl: number };

/**
 * The pop-up schedule for a 30 s round: a shape every 450–700 ms (faster later), visible for
 * 900 ms (850 later), about 28 % red, never two live shapes in the same cell.
 */
export function popSchedule(seed: number, durationMs = 30_000): Pop[] {
  const rand = rng(seed);
  const pops: Pop[] = [];
  let at = 400;
  while (at < durationMs - 300) {
    const ttl = at > durationMs / 2 ? 850 : 900;
    const busy = new Set(pops.filter((p) => p.at + p.ttl > at).map((p) => p.cell));
    const free = Array.from({ length: TAP_COLS * TAP_ROWS }, (_, i) => i).filter(
      (c) => !busy.has(c),
    );
    if (free.length) pops.push({ at, cell: pick(free, rand), red: false, ttl });
    at += Math.round((at > durationMs / 2 ? 450 : 560) + rand() * 140);
  }
  // Exactly 28 % red, spread at random (never the first one).
  const reds = shuffle(pops.map((_, i) => i).slice(1), rand).slice(
    0,
    Math.round(pops.length * 0.28),
  );
  for (const i of reds) pops[i]!.red = true;
  return pops;
}

export function redStars(hits: number, slips: number): 1 | 2 | 3 {
  if (hits < 6) return 1;
  return slips ? 2 : 3;
}
