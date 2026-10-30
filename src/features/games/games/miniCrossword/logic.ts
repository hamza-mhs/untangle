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
