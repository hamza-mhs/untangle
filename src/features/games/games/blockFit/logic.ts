import { pick, randInt } from '@/lib/rng';

export const FIT_SIZE = 8;
export type Cell = [number, number];
export type Piece = { id: string; cells: Cell[] };

/** Piece shapes as [row, col] offsets. */
export const PIECES: readonly Piece[] = [
  { id: 'dot', cells: [[0, 0]] },
  {
    id: 'i2',
    cells: [
      [0, 0],
      [0, 1],
    ],
  },
  {
    id: 'i2v',
    cells: [
      [0, 0],
      [1, 0],
    ],
  },
  {
    id: 'i3',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
  },
  {
    id: 'i3v',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  },
  {
    id: 'sq',
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  },
  {
    id: 'l3',
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
    ],
  },
  {
    id: 'j3',
    cells: [
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  },
  {
    id: 'l4',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ],
  },
  {
    id: 't4',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
    ],
  },
  {
    id: 'i4',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ],
  },
];

export type Board = boolean[][];

export function emptyBoard(n = FIT_SIZE): Board {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => false));
}

export function canPlace(b: Board, p: Piece, r: number, c: number): boolean {
  return p.cells.every(([dr, dc]) => {
    const rr = r + dr;
    const cc = c + dc;
    return rr >= 0 && cc >= 0 && rr < b.length && cc < b.length && !b[rr]![cc];
  });
}

/** Places the piece and clears full rows and columns. */
export function place(b: Board, p: Piece, r: number, c: number): { board: Board; lines: number } {
  const next = b.map((row) => [...row]);
  for (const [dr, dc] of p.cells) next[r + dr]![c + dc] = true;
  const n = next.length;
  const rows = next.map((row, i) => (row.every(Boolean) ? i : -1)).filter((i) => i >= 0);
  const cols = Array.from({ length: n }, (_, j) => j).filter((j) => next.every((row) => row[j]));
  for (const i of rows) next[i] = next[i]!.map(() => false);
  for (const j of cols) for (const row of next) row[j] = false;
  return { board: next, lines: rows.length + cols.length };
}

export function fitsAnywhere(b: Board, p: Piece): boolean {
  for (let r = 0; r < b.length; r++)
    for (let c = 0; c < b.length; c++) if (canPlace(b, p, r, c)) return true;
  return false;
}

/** A tray of three pieces; at least one fits the board when anything can. */
export function makeTray(rand: () => number, b: Board): Piece[] {
  const tray = [pick(PIECES, rand), pick(PIECES, rand), pick(PIECES, rand)];
  if (!tray.some((p) => fitsAnywhere(b, p))) {
    const fitting = PIECES.filter((p) => fitsAnywhere(b, p));
    if (fitting.length) tray[randInt(rand, 3)] = pick(fitting, rand);
  }
  return tray;
}

export function fitStars(lines: number, misfits: number): 1 | 2 | 3 {
  if (lines === 0) return 1;
  return misfits ? 2 : 3;
}
