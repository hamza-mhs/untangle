/**
 * Deterministic PRNG (mulberry32). Every rep generator takes an Rng so puzzles are reproducible
 * from a seed (stored with each result in SQLite) and tests are stable.
 */
export type Rng = {
  /** Float in [0, 1). */
  next: () => number;
  /** Integer in [min, max] inclusive. */
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  shuffle: <T>(items: readonly T[]) => T[];
};

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    pick: (items) => {
      if (items.length === 0) throw new Error('pick() from empty list');
      return items[int(0, items.length - 1)]!;
    },
    shuffle: (items) => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(0, i);
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
  };
}

/** Stable 32-bit hash of a string, for seeds like `${dayKey}:draw`. */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
