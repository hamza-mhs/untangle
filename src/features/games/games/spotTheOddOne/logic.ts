import { randInt, rng } from '@/lib/rng';

export const ODD_ROUNDS = 8;
export const ODD_SECONDS = 30;
export const ODD_TILES = 16;
/** Base tile colours (game accents), as in the prototype's `pick([...])`. */
export const ODD_BASES = ['pink', 'sky', 'mint', 'violet', 'orange', 'sun'] as const;
export type OddBase = (typeof ODD_BASES)[number];

export type OddBoard = {
  base: OddBase;
  odd: number;
  /** `shade`: the odd tile is mixed toward white by `diff` %; `flip`: its glyph is upside down. */
  kind: 'shade' | 'flip';
  diff: number;
};

/** Mix toward white for round r (1-based): 27 %, 24 %, … never under 8 %. */
export function oddDiff(r: number): number {
  return Math.max(8, 30 - r * 3);
}

export function oddPoints(r: number): number {
  return 10 + r * 5;
}

/** Every third round flips a glyph; the rest are a shade off, subtler each round. */
export function oddBoards(seed: number, n = ODD_ROUNDS): OddBoard[] {
  const rand = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const r = i + 1;
    return {
      base: ODD_BASES[randInt(rand, ODD_BASES.length)]!,
      odd: randInt(rand, ODD_TILES),
      kind: r % 3 === 0 ? 'flip' : 'shade',
      diff: oddDiff(r),
    };
  });
}

/** `#rrggbb` mixed toward white by `pct` % (CSS `color-mix(in srgb, c (100-pct)%, #fff)`). */
export function mixWhite(hex: string, pct: number): string {
  const n = parseInt(hex.slice(1, 7), 16);
  const ch = (v: number) =>
    Math.round(v + (255 - v) * (pct / 100))
      .toString(16)
      .padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

export function oddStars(found: number): 1 | 2 | 3 {
  return found >= 7 ? 3 : found >= 4 ? 2 : 1;
}
