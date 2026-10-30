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
