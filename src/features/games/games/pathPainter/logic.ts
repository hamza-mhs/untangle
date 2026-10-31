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

/** Points per newly painted square (once per square per board) and per finished board. */
export const PAINT_CELL_POINTS = 2;
export const PAINT_BOARD_POINTS = 50;

/** Prototype: the enamel hue moves on every 5 squares of the path. */
export const PAINT_HUES = ['sky', 'mint', 'sun', 'orange', 'pink'] as const;
export type PaintHue = (typeof PAINT_HUES)[number];
export function paintHue(step: number): PaintHue {
  return PAINT_HUES[Math.floor(step / 5) % PAINT_HUES.length]!;
}

/** The path is stored as cell indices (row * size + col), as the grid drag reports them. */
function isRock(size: number, rocks: readonly Cell[], i: number) {
  return rocks.some(([r, c]) => r * size + c === i);
}

function neighbours(size: number, i: number): number[] {
  const r = Math.floor(i / size);
  const c = i % size;
  const out: number[] = [];
  for (const [dr, dc] of dirs) {
    const y = r + dr;
    const x = c + dc;
    if (y >= 0 && x >= 0 && y < size && x < size) out.push(y * size + x);
  }
  return out;
}

export function freeCount(size: number, rocks: readonly Cell[]): number {
  return size * size - rocks.length;
}

/**
 * What dragging into cell `i` does: paint it (`extend`: next to the head, free, unpainted),
 * un-paint the last step (`undo`: back onto the previous cell), or nothing.
 */
export function paintMove(
  size: number,
  rocks: readonly Cell[],
  path: readonly number[],
  i: number,
): 'extend' | 'undo' | 'none' {
  if (!path.length) return 'none';
  if (path.length >= 2 && path[path.length - 2] === i) return 'undo';
  const head = path[path.length - 1]!;
  if (!neighbours(size, head).includes(i)) return 'none';
  if (isRock(size, rocks, i) || path.includes(i)) return 'none';
  return 'extend';
}

/**
 * What a new touch on cell `i` does. Touching the head continues the path; a step next to it
 * (or back onto the previous cell) works like a drag, which is the tap / TalkBack path;
 * anywhere else starts over from that cell. Rocks do nothing.
 */
export function paintTouch(
  size: number,
  rocks: readonly Cell[],
  path: readonly number[],
  i: number,
): 'continue' | 'extend' | 'undo' | 'restart' | 'none' {
  if (isRock(size, rocks, i)) return 'none';
  if (path[path.length - 1] === i) return 'continue';
  const m = paintMove(size, rocks, path, i);
  return m === 'none' ? 'restart' : m;
}

/** Starting over costs a wipe only once a stroke was drawn (re-picking the start is free). */
export function restartIsWipe(path: readonly number[]): boolean {
  return path.length > 1;
}

/** Squares remain but the head has no free, unpainted neighbour. */
export function isTrapped(size: number, rocks: readonly Cell[], path: readonly number[]): boolean {
  if (!path.length || path.length >= freeCount(size, rocks)) return false;
  const head = path[path.length - 1]!;
  return !neighbours(size, head).some((k) => !isRock(size, rocks, k) && !path.includes(k));
}

export function isPainted(size: number, rocks: readonly Cell[], path: readonly number[]): boolean {
  return path.length === freeCount(size, rocks);
}

/** The prototype's tip after a wipe: say "corner" when the stored solution ends in one. */
export function cornerTip(b: Pick<PaintBoard, 'size' | 'path'>): boolean {
  const ends = [b.path[0], b.path[b.path.length - 1]];
  return ends.some(
    (p) => !!p && (p[0] === 0 || p[0] === b.size - 1) && (p[1] === 0 || p[1] === b.size - 1),
  );
}
