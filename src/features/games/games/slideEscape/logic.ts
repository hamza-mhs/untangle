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

/** Points for each board escaped (prototype). */
export const ESCAPE_POINTS = 60;
/** Boards at or under this minimum count as the round's easier opener. */
export const EASY_MAX_MOVES = 5;

/**
 * The round's two boards from candidates in serving order (fresh first): the first easy one
 * (minMoves ≤ 5), then the first harder one. Falls back to the first two, easier first.
 */
export function pickBoardPair<T extends { minMoves: number }>(list: readonly T[]): T[] {
  const easy = list.find((b) => b.minMoves <= EASY_MAX_MOVES);
  const hard = list.find((b) => b.minMoves > EASY_MAX_MOVES);
  if (easy && hard) return [easy, hard];
  return list.slice(0, SLIDE_BOARDS).sort((a, b) => a.minMoves - b.minMoves);
}

/** Cell (row * n + col) → piece index, or -1 when empty. */
export function occupied(ps: readonly Block[], n = SLIDE_SIZE): number[] {
  return Array.from(occupancy(ps, n));
}

/** Slide range of every piece, in piece order. */
export function allRanges(ps: readonly Block[], n = SLIDE_SIZE): [number, number][] {
  return ps.map((_, i) => slideRange(ps, i, n));
}

/** How far the gem slides to escape when its path to the right edge is clear, else null. */
export function gemExit(ps: readonly Block[], n = SLIDE_SIZE): number | null {
  const hi = slideRange(ps, 0, n)[1];
  return hi > 0 && ps[0]!.c + GEM_LEN + hi === n ? hi : null;
}

export type TapSlide =
  /** The cell isn't in the piece's line (or is under the piece itself). */
  | { kind: 'off' }
  /** Something is in the way: `dir` is the way the player tried to push it. */
  | { kind: 'blocked'; dir: 1 | -1 }
  | { kind: 'slide'; by: number };

/** Tap-to-move: slide piece `i` so it covers (row, col), if that cell is in its line and reachable. */
export function tapSlide(
  ps: readonly Block[],
  i: number,
  row: number,
  col: number,
  n = SLIDE_SIZE,
): TapSlide {
  const p = ps[i]!;
  const along = p.d === 'h' ? col : row;
  const start = p.d === 'h' ? p.c : p.r;
  if ((p.d === 'h' ? row !== p.r : col !== p.c) || (along >= start && along < start + p.len)) {
    return { kind: 'off' };
  }
  const by = along < start ? along - start : along - (start + p.len - 1);
  const [lo, hi] = slideRange(ps, i, n);
  if (by < lo || by > hi) return { kind: 'blocked', dir: by < 0 ? -1 : 1 };
  return { kind: 'slide', by };
}

/**
 * Where a drag lands: the finger's offset in cells, rounded to the nearest whole cell and kept
 * inside the piece's range. `bump` is set when the player pushed at least half a cell into a
 * side that is already blocked and the piece didn't move. Runs on the UI thread (drag release).
 */
export function dragSnap(cells: number, lo: number, hi: number): { by: number; bump: 0 | 1 | -1 } {
  'worklet';
  const by = Math.max(lo, Math.min(hi, Math.round(cells)));
  const bump =
    by === 0 && cells >= 0.5 && hi === 0 ? 1 : by === 0 && cells <= -0.5 && lo === 0 ? -1 : 0;
  return { by: by === 0 ? 0 : by, bump };
}
