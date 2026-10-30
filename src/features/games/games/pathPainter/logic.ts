export const PAINT_SECONDS = 60;
export const PAINT_BOARDS = 2;

export type Cell = [number, number];
export type PaintBoard = { id: string; size: number; rocks: Cell[]; path: Cell[] };

const dirs: Cell[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * One path that visits every non-rock cell once (from `start` if given), or null.
 * Warnsdorff ordering (fewest onward moves first) keeps 5×5–6×6 instant.
 */
export function findPaintPath(size: number, rocks: readonly Cell[], start?: Cell): Cell[] | null {
  const n = size;
  const blocked = new Uint8Array(n * n);
  for (const [r, c] of rocks) blocked[r * n + c] = 1;
  const total = n * n - rocks.length;
  const path: number[] = [];
  const nbs = (i: number) => {
    const r = Math.floor(i / n);
    const c = i % n;
    const out: number[] = [];
    for (const [dr, dc] of dirs) {
      const y = r + dr;
      const x = c + dc;
      if (y >= 0 && x >= 0 && y < n && x < n && !blocked[y * n + x]) out.push(y * n + x);
    }
    return out;
  };
  const degree = (i: number) => nbs(i).length;
  const dfs = (i: number): boolean => {
    blocked[i] = 1;
    path.push(i);
    if (path.length === total) return true;
    const next = nbs(i);
    // Every unvisited cell needs a way in; at most one may be a dead end (the path's end).
    const nextSet = new Set(next);
    let ends = 0;
    for (let k = 0; k < n * n; k++) {
      if (blocked[k]) continue;
      const d = degree(k) + (nextSet.has(k) ? 1 : 0);
      if (d === 0) return undo(i);
      if (d === 1 && ++ends > 1) return undo(i);
    }
    next.sort((a, b) => degree(a) - degree(b));
    for (const k of next) if (dfs(k)) return true;
    return undo(i);
  };
  const undo = (i: number) => {
    blocked[i] = 0;
    path.pop();
    return false;
  };
  const starts = start
    ? [start[0] * n + start[1]]
    : Array.from({ length: n * n }, (_, i) => i).filter((i) => !blocked[i]);
  for (const s of starts)
    if (!blocked[s] && dfs(s)) return path.map((i) => [Math.floor(i / n), i % n]);
  return null;
}

/** True when `path` paints every non-rock cell exactly once, one step at a time. */
export function isPaintSolution(b: Pick<PaintBoard, 'size' | 'rocks' | 'path'>): boolean {
  const n = b.size;
  const rock = new Set(b.rocks.map(([r, c]) => r * n + c));
  const seen = new Set<number>();
  for (let i = 0; i < b.path.length; i++) {
    const [r, c] = b.path[i]!;
    const k = r * n + c;
    if (r < 0 || c < 0 || r >= n || c >= n || rock.has(k) || seen.has(k)) return false;
    if (i > 0) {
      const [pr, pc] = b.path[i - 1]!;
      if (Math.abs(pr - r) + Math.abs(pc - c) !== 1) return false;
    }
    seen.add(k);
  }
  return seen.size === n * n - rock.size;
}

/** Can the painter still finish from here? (head = last painted cell). Used to flag a trap early. */
export function canFinish(size: number, rocks: readonly Cell[], painted: readonly Cell[]): boolean {
  if (!painted.length) return findPaintPath(size, rocks) !== null;
  const head = painted.at(-1)!;
  const rest = [...rocks, ...painted.slice(0, -1)];
  return findPaintPath(size, rest, head) !== null;
}

export function paintStars(wipes: number, boards: number): 1 | 2 | 3 {
  return boards >= PAINT_BOARDS ? (wipes ? 2 : 3) : boards > 0 ? 2 : 1;
}
