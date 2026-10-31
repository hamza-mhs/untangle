export const FLOW_SECONDS = 60;
export const FLOW_BOARDS = 2;

export type Cell = [number, number];
/** One colour: its two jewels and the solution tube (jewel to jewel). */
export type Flow = { a: Cell; b: Cell; path: Cell[] };
export type FlowBoard = { id: string; size: number; flows: Flow[] };

const key = (r: number, c: number, n: number) => r * n + c;

/**
 * Counts solutions (up to `limit`): every pair joined by a tube, tubes never cross, and every
 * cell is filled. Used by the generator (keep unique boards) and the pack test.
 */
export function countFlowSolutions(
  size: number,
  flows: readonly Pick<Flow, 'a' | 'b'>[],
  limit = 2,
) {
  const n = size;
  const N = n * n;
  const grid = new Int8Array(N).fill(-1);
  flows.forEach((f, i) => {
    grid[key(f.a[0], f.a[1], n)] = i;
    grid[key(f.b[0], f.b[1], n)] = i;
  });
  const nb: number[][] = Array.from({ length: N }, (_, i) => {
    const r = Math.floor(i / n);
    const c = i % n;
    const out: number[] = [];
    if (r > 0) out.push(i - n);
    if (r < n - 1) out.push(i + n);
    if (c > 0) out.push(i - 1);
    if (c < n - 1) out.push(i + 1);
    return out;
  });
  const ends = flows.map((f) => [key(f.a[0], f.a[1], n), key(f.b[0], f.b[1], n)] as const);
  let found = 0;

  // An empty cell needs two usable neighbours (it will be the middle of some tube).
  const deadEnd = (ci: number, head: number) => {
    for (let i = 0; i < N; i++) {
      if (grid[i] !== -1) continue;
      let free = 0;
      for (const j of nb[i]!) {
        const g = grid[j]!;
        if (g === -1 || j === head) free++;
        else if (g > ci && (j === ends[g]![0] || j === ends[g]![1])) free++;
        else if (g === ci && j === ends[ci]![1]) free++;
      }
      if (free < 2) return true;
    }
    return false;
  };

  const solveFrom = (ci: number): void => {
    if (found >= limit) return;
    if (ci === flows.length) {
      if (!grid.includes(-1)) found++;
      return;
    }
    walk(ci, ends[ci]![0]);
  };

  const walk = (ci: number, head: number): void => {
    if (found >= limit) return;
    for (const j of nb[head]!) {
      if (j === ends[ci]![1]) {
        solveFrom(ci + 1);
        continue;
      }
      if (grid[j] !== -1) continue;
      grid[j] = ci;
      if (!deadEnd(ci, j)) walk(ci, j);
      grid[j] = -1;
      if (found >= limit) return;
    }
  };

  solveFrom(0);
  return found;
}

/** True when `flows[].path` is a valid full solution of the board. */
export function isFlowSolution(board: Pick<FlowBoard, 'size' | 'flows'>): boolean {
  const n = board.size;
  const seen = new Set<number>();
  for (const f of board.flows) {
    const p = f.path;
    const [r0, c0] = p[0]!;
    const [r1, c1] = p.at(-1)!;
    if (r0 !== f.a[0] || c0 !== f.a[1] || r1 !== f.b[0] || c1 !== f.b[1]) return false;
    for (let i = 0; i < p.length; i++) {
      const [r, c] = p[i]!;
      if (r < 0 || c < 0 || r >= n || c >= n) return false;
      const k = key(r, c, n);
      if (seen.has(k)) return false;
      seen.add(k);
      if (i > 0) {
        const [pr, pc] = p[i - 1]!;
        if (Math.abs(pr - r) + Math.abs(pc - c) !== 1) return false;
      }
    }
  }
  return seen.size === n * n;
}

export function flowStars(redraws: number, boards: number): 1 | 2 | 3 {
  return boards >= FLOW_BOARDS ? (redraws ? 2 : 3) : boards > 0 ? 2 : 1;
}

/** Points: each pair joined the first time on a board, and each finished board (prototype). */
export const FLOW_JOIN_POINTS = 15;
export const FLOW_BOARD_POINTS = 50;

/**
 * Live board while drawing. Cells are indices (row * size + col). A tube is empty or starts on
 * one of its colour's jewels and runs cell by cell; it is joined when it ends on the other one.
 */
export type FlowState = {
  size: number;
  /** Per colour: its two jewel cells. */
  ends: (readonly [number, number])[];
  tubes: number[][];
};

export function flowInit(board: Pick<FlowBoard, 'size' | 'flows'>): FlowState {
  const n = board.size;
  return {
    size: n,
    ends: board.flows.map((f) => [key(f.a[0], f.a[1], n), key(f.b[0], f.b[1], n)] as const),
    tubes: board.flows.map(() => []),
  };
}

/** Colour whose jewel sits on cell i, or -1. */
export function jewelOf(s: FlowState, i: number) {
  return s.ends.findIndex((e) => e[0] === i || e[1] === i);
}

/** Colour whose tube runs through cell i, or -1. */
export function ownerOf(s: FlowState, i: number) {
  return s.tubes.findIndex((t) => t.includes(i));
}

export function isJoined(s: FlowState, f: number) {
  const t = s.tubes[f]!;
  const e = s.ends[f]!;
  if (t.length < 2) return false;
  const first = t[0]!;
  const last = t.at(-1)!;
  return (first === e[0] && last === e[1]) || (first === e[1] && last === e[0]);
}

/** Every pair joined and every cell filled. */
export function isSolved(s: FlowState) {
  if (!s.ends.every((_, f) => isJoined(s, f))) return false;
  return s.tubes.reduce((n, t) => n + t.length, 0) === s.size * s.size;
}

export function adjacent(s: FlowState, i: number, j: number) {
  const n = s.size;
  return Math.abs(Math.floor(i / n) - Math.floor(j / n)) + Math.abs((i % n) - (j % n)) === 1;
}

const withTube = (s: FlowState, f: number, tube: number[]): FlowState => ({
  ...s,
  tubes: s.tubes.map((t, k) => (k === f ? tube : t)),
});

/**
 * Finger down on cell i. On a jewel: that colour's tube restarts from it. On a tube: the tube
 * is cut back to that cell and drawing continues from there. Empty cell: nothing (-1).
 */
export function flowStart(s: FlowState, i: number): { state: FlowState; active: number } {
  const j = jewelOf(s, i);
  if (j >= 0) return { state: withTube(s, j, [i]), active: j };
  const o = ownerOf(s, i);
  if (o < 0) return { state: s, active: -1 };
  const t = s.tubes[o]!;
  return { state: withTube(s, o, t.slice(0, t.indexOf(i) + 1)), active: o };
}

/**
 * The tube of colour `a` moves onto neighbour cell i. Back over itself shortens it; a joined
 * tube stops at its jewel; another colour's jewel blocks (`blocked`); another colour's tube is
 * cut where it is crossed (standard Flow behaviour). Non-adjacent cells are ignored.
 */
export function flowStep(
  s: FlowState,
  a: number,
  i: number,
): { state: FlowState; blocked: boolean } {
  const t = s.tubes[a];
  const same = { state: s, blocked: false };
  if (!t || t.length === 0) return same;
  const k = t.indexOf(i);
  if (k >= 0)
    return k === t.length - 1 ? same : { state: withTube(s, a, t.slice(0, k + 1)), blocked: false };
  if (!adjacent(s, t.at(-1)!, i) || isJoined(s, a)) return same;
  const j = jewelOf(s, i);
  if (j >= 0 && j !== a) return { state: s, blocked: true };
  let next = s;
  const o = ownerOf(s, i);
  if (o >= 0 && o !== a) {
    const ot = s.tubes[o]!;
    next = withTube(s, o, ot.slice(0, ot.indexOf(i)));
  }
  return { state: withTube(next, a, [...t, i]), blocked: false };
}

/**
 * A finger-down that may continue the last tube (the tap / TalkBack path: tap a jewel, then
 * tap neighbouring cells one by one). Continues when cell i is next to the active tube's open
 * end and isn't a jewel of another colour; otherwise it's a fresh start.
 */
export function flowTap(
  s: FlowState,
  active: number,
  i: number,
): { state: FlowState; active: number; blocked: boolean } {
  const t = active >= 0 ? s.tubes[active] : undefined;
  if (t && t.length > 0 && !t.includes(i) && !isJoined(s, active)) {
    const j = jewelOf(s, i);
    if (adjacent(s, t.at(-1)!, i) && (j < 0 || j === active))
      return { ...flowStep(s, active, i), active };
  }
  return { ...flowStart(s, i), blocked: false };
}

/**
 * Redraws: colours that were joined when the finger last lifted (`settled`) and aren't now.
 * Joining and backing off within one drag doesn't count.
 */
export function brokenFlows(s: FlowState, settled: readonly boolean[]) {
  return s.ends.map((_, f) => f).filter((f) => settled[f] && !isJoined(s, f));
}
