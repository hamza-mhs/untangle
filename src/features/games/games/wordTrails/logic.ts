export const TRAIL_SECONDS = 60;
export const TRAIL_WORDS = 5;

/** Six letter beads and the five tray words they spell. */
export type TrailBoard = { id: string; letters: string; words: string[] };

/** Can `word` be spelled from `letters`, each bead used at most once? */
export function spellable(word: string, letters: string): boolean {
  const pool = [...letters];
  for (const ch of word) {
    const i = pool.indexOf(ch);
    if (i < 0) return false;
    pool.splice(i, 1);
  }
  return true;
}

/** Prototype: all five found 3★, else 2★; none found 1★. */
export function trailStars(found: number): 1 | 2 | 3 {
  return found >= TRAIL_WORDS ? 3 : found > 0 ? 2 : 1;
}
