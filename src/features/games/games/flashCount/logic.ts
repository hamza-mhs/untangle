import { randInt, rng, shuffle } from '@/lib/rng';

export const FLASH_TRIALS = 8;
export const FLASH_SECONDS = 40;
/** The prototype well, in px; dots are placed in this frame and scaled to the real well. */
export const WELL = { w: 264, h: 200, margin: 26, gap: 40 } as const;

export type FlashTrial = {
  /** Dot centres as fractions of the well (0–1). */
  dots: { x: number; y: number }[];
  /** Four answer keys, shuffled; one is `dots.length`. */
  options: number[];
};

/** Flash time for trial n (1-based). */
export function flashMs(n: number): number {
  return Math.max(450, 900 - n * 50);
}

export function flashPoints(count: number): number {
  return 10 + count * 2;
}

function place(count: number, rand: () => number) {
  const pts: [number, number][] = [];
  const { w, h, margin, gap } = WELL;
  for (let tries = 0; pts.length < count && tries < 2000; tries++) {
    const p: [number, number] = [
      margin + rand() * (w - 2 * margin),
      margin + rand() * (h - 2 * margin),
    ];
    if (pts.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > gap)) pts.push(p);
  }
  return pts.map(([x, y]) => ({ x: x / w, y: y / h }));
}

/** 8 trials; 3–9 dots that never touch (≥ 40 px apart in the prototype well). */
export function flashTrials(seed: number, n = FLASH_TRIALS): FlashTrial[] {
  const rand = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const count = Math.min(9, 3 + Math.floor((i + 1) * 0.8) + randInt(rand, 2));
    const far = count + (rand() < 0.5 ? 2 : -2);
    return {
      dots: place(count, rand),
      options: shuffle([count, count - 1, count + 1, far], rand),
    };
  });
}

export function flashStars(right: number): 1 | 2 | 3 {
  return right >= 7 ? 3 : right >= 4 ? 2 : 1;
}
