export const NONO_SECONDS = 90;
export const NONO_LIVES = 3;
export const NONO_SIZE = 5;

/** Rows as strings of 0/1 ("01010"). */
export type NonoBoard = { id: string; name?: string; rows: string[] };

export function grid(b: Pick<NonoBoard, 'rows'>): number[][] {
  return b.rows.map((r) => [...r].map((ch) => (ch === '1' ? 1 : 0)));
}

/** Run lengths of filled cells, e.g. [1,1,0,1,1] → [2,2]; an empty line → [0]. */
export function clue(line: readonly number[]): number[] {
  const out: number[] = [];
  let run = 0;
  for (const v of line) {
    if (v) run++;
    else if (run) {
      out.push(run);
      run = 0;
    }
  }
  if (run) out.push(run);
  return out.length ? out : [0];
}

export function clues(g: readonly (readonly number[])[]) {
  const n = g.length;
  return {
    rows: g.map((r) => clue(r)),
    cols: Array.from({ length: n }, (_, c) => clue(g.map((r) => r[c]!))),
  };
}

/** Every filling of a line of length n that matches the clue. */
function placements(c: readonly number[], n: number): number[][] {
  if (c.length === 1 && c[0] === 0) return [new Array<number>(n).fill(0)];
  const out: number[][] = [];
  const rec = (i: number, pos: number, acc: number[]) => {
    if (i === c.length) {
      out.push([...acc, ...new Array<number>(n - acc.length).fill(0)]);
      return;
    }
    const len = c[i]!;
    const restMin = c.slice(i + 1).reduce((s, v) => s + v + 1, 0);
    for (let s = pos; s + len + restMin <= n; s++) {
      const next = [
        ...acc,
        ...new Array<number>(s - acc.length).fill(0),
        ...new Array<number>(len).fill(1),
      ];
      if (i < c.length - 1) next.push(0);
      rec(i + 1, next.length, next);
    }
  };
  rec(0, 0, []);
  return out;
}

/**
 * Line-by-line deduction only (no guessing). Returns the solved grid, or null when the
 * clues alone don't settle every cell. -1 = unknown during solving.
 */
export function lineSolve(
  rowClues: readonly (readonly number[])[],
  colClues: readonly (readonly number[])[],
): number[][] | null {
  const n = rowClues.length;
  const g = Array.from({ length: n }, () => new Array<number>(n).fill(-1));
  const rowP = rowClues.map((c) => placements(c, n));
  const colP = colClues.map((c) => placements(c, n));
  let changed = true;
  while (changed) {
    changed = false;
    const settle = (
      opts: number[][],
      get: (i: number) => number,
      set: (i: number, v: number) => void,
    ) => {
      const fit = opts.filter((p) => p.every((v, i) => get(i) === -1 || get(i) === v));
      if (!fit.length) return false;
      for (let i = 0; i < n; i++) {
        if (get(i) !== -1) continue;
        const v = fit[0]![i]!;
        if (fit.every((p) => p[i] === v)) {
          set(i, v);
          changed = true;
        }
      }
      return true;
    };
    for (let r = 0; r < n; r++)
      if (
        !settle(
          rowP[r]!,
          (i) => g[r]![i]!,
          (i, v) => (g[r]![i] = v),
        )
      )
        return null;
    for (let c = 0; c < n; c++)
      if (
        !settle(
          colP[c]!,
          (i) => g[i]![c]!,
          (i, v) => (g[i]![c] = v),
        )
      )
        return null;
  }
  return g.every((r) => r.every((v) => v !== -1)) ? g : null;
}

export function isLineSolvable(b: Pick<NonoBoard, 'rows'>): boolean {
  const g = grid(b);
  const { rows, cols } = clues(g);
  const s = lineSolve(rows, cols);
  return !!s && s.every((r, i) => r.every((v, j) => v === g[i]![j]));
}

/** Prototype: no mistakes 3★, else 2★; running out of lives or time 1★. */
export function nonoStars(mistakes: number, solved: boolean): 1 | 2 | 3 {
  return !solved ? 1 : mistakes ? 2 : 3;
}
