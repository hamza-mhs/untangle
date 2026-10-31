import { rng, shuffle } from '@/lib/rng';

export const CROSS_SECONDS = 90;
export const CROSS_SIZE = 3;

/**
 * A full 3×3 grid: rows read across (1, 4, 5 across) and columns read down (1, 2, 3 down),
 * all six real words, as in the design.
 */
export type Crossword = {
  id: string;
  rows: string[];
  across: string[];
  down: string[];
};

export function columns(rows: readonly string[]): string[] {
  return Array.from({ length: rows.length }, (_, c) => rows.map((r) => r[c]).join(''));
}

/** Prototype: no wrong letters 3★, else 2★; unfinished 1★. */
export function crossStars(wrong: number, done: boolean): 1 | 2 | 3 {
  return !done ? 1 : wrong ? 2 : 3;
}

/** Points: each right letter, each finished row, the solved grid (prototype). */
export const CROSS_LETTER_POINTS = 5;
export const CROSS_ROW_POINTS = 20;
export const CROSS_SOLVED_POINTS = 60;
/** Letter keys on the board (prototype: 9, five over four). */
export const CROSS_KEYS = 9;

/** Across clue numbers per row and down clue numbers per column (1/4/5 across, 1/2/3 down). */
export const ACROSS_NUMS = [1, 4, 5] as const;
export const DOWN_NUMS = [1, 2, 3] as const;
/** The small number in each square, row by row (0 = none). */
export const CELL_NUMS = [1, 2, 3, 4, 0, 0, 5, 0, 0] as const;

/** Plausible decoy letters, most common first. */
const DECOYS = 'etaoinsrhldcumpgbfywkv';

/**
 * The keyboard: every letter in the grid once, plus common decoys up to `CROSS_KEYS`,
 * shuffled by seed. A grid never has more than nine distinct letters.
 */
export function keysFor(rows: readonly string[], seed: number): string[] {
  const own = [...new Set(rows.join('').toLowerCase())];
  const rand = rng(seed);
  const pool = shuffle([...DECOYS].filter((ch) => !own.includes(ch)).slice(0, 10), rand);
  return shuffle([...own, ...pool.slice(0, Math.max(0, CROSS_KEYS - own.length))], rand);
}

/**
 * Where a typed letter goes in `row`: the `cursor` square if it is in that row and empty,
 * else the first empty square. -1 when the row is full.
 */
export function targetCell(cells: readonly string[], row: number, cursor: number | null): number {
  const start = row * CROSS_SIZE;
  if (cursor !== null && Math.floor(cursor / CROSS_SIZE) === row && !cells[cursor]) return cursor;
  for (let i = start; i < start + CROSS_SIZE; i++) if (!cells[i]) return i;
  return -1;
}

/** True when `letter` is the right answer for square `i`. */
export function isRightLetter(grid: Crossword, i: number, letter: string): boolean {
  const r = Math.floor(i / CROSS_SIZE);
  const c = i % CROSS_SIZE;
  return grid.rows[r]?.[c]?.toLowerCase() === letter.toLowerCase();
}

/** True when every square of `row` holds a letter. */
export function rowFull(cells: readonly string[], row: number): boolean {
  return cells.slice(row * CROSS_SIZE, (row + 1) * CROSS_SIZE).every((ch) => !!ch);
}
