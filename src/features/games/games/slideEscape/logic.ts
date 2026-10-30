export const SLIDE_SECONDS = 60;
export const SLIDE_BOARDS = 2;
export const SLIDE_SIZE = 5;
/** The gem is a 2-wide horizontal piece that leaves through the right edge of its row. */
export const GEM_LEN = 2;

export type Dir = 'h' | 'v';
export type Block = { d: Dir; r: number; c: number; len: number };
export type SlideBoard = { id: string; gem: [number, number]; blocks: Block[]; minMoves: number };

/** Pieces as one list: index 0 is the gem. */
export function pieces(gem: readonly [number, number], blocks: readonly Block[]): Block[] {
  return [{ d: 'h', r: gem[0], c: gem[1], len: GEM_LEN }, ...blocks.map((b) => ({ ...b }))];
}

export function cellsOf(p: Block): [number, number][] {
  return Array.from({ length: p.len }, (_, i) =>
    p.d === 'h' ? ([p.r, p.c + i] as [number, number]) : ([p.r + i, p.c] as [number, number]),
  );
}

function occupancy(ps: readonly Block[], n: number, skip = -1): Int8Array {
  const g = new Int8Array(n * n).fill(-1);
  ps.forEach((p, i) => {
    if (i === skip) return;
    for (const [r, c] of cellsOf(p)) g[r * n + c] = i;
  });
  return g;
}

/** How far piece `i` can slide: [most negative offset, most positive offset]. */
export function slideRange(ps: readonly Block[], i: number, n = SLIDE_SIZE): [number, number] {
  const g = occupancy(ps, n, i);
  const p = ps[i]!;
  const free = (r: number, c: number) => r >= 0 && c >= 0 && r < n && c < n && g[r * n + c] === -1;
  let lo = 0;
  let hi = 0;
  if (p.d === 'h') {
    while (free(p.r, p.c + lo - 1)) lo--;
    while (free(p.r, p.c + p.len + hi)) hi++;
  } else {
    while (free(p.r + lo - 1, p.c)) lo--;
    while (free(p.r + p.len + hi, p.c)) hi++;
  }
  return [lo, hi];
}

export function moved(ps: readonly Block[], i: number, by: number): Block[] {
  return ps.map((p, j) =>
    j !== i ? p : p.d === 'h' ? { ...p, c: p.c + by } : { ...p, r: p.r + by },
  );
}

/** Solved when the gem's front touches the right edge. */
export function isEscaped(ps: readonly Block[], n = SLIDE_SIZE): boolean {
  return ps[0]!.c + GEM_LEN === n;
}

const sig = (ps: readonly Block[]) => ps.map((p) => (p.d === 'h' ? p.c : p.r)).join(',');

/** Fewest slides (any distance = 1 move) to escape, or -1. */
export function minSlideMoves(
  gem: readonly [number, number],
  blocks: readonly Block[],
  n = SLIDE_SIZE,
  cap = 40,
): number {
  const start = pieces(gem, blocks);
  if (isEscaped(start, n)) return 0;
  let frontier = [start];
  const seen = new Set([sig(start)]);
  for (let depth = 1; depth <= cap && frontier.length; depth++) {
    const next: Block[][] = [];
    for (const ps of frontier) {
      for (let i = 0; i < ps.length; i++) {
        const [lo, hi] = slideRange(ps, i, n);
        for (let by = lo; by <= hi; by++) {
          if (!by) continue;
          const q = moved(ps, i, by);
          if (isEscaped(q, n)) return depth;
          const s = sig(q);
          if (seen.has(s)) continue;
          seen.add(s);
          next.push(q);
        }
      }
    }
    frontier = next;
  }
  return -1;
}

/** Prototype: 2 + 1 for both boards. A partial run still earns 1–2. */
export function slideStars(escaped: number): 1 | 2 | 3 {
  return escaped >= SLIDE_BOARDS ? 3 : escaped > 0 ? 2 : 1;
}
