export const FORGE_SECONDS = 60;
export const FORGE_RACK = 7;
export const FORGE_MIN = 3;

/** A seven-letter rack and every real word (3+ letters) it can make. */
export type Rack = { id: string; letters: string; words: string[] };

/** Can `word` be built from the rack, each tile used at most once? */
export function fromRack(word: string, letters: string): boolean {
  const pool = [...letters];
  for (const ch of word) {
    const i = pool.indexOf(ch);
    if (i < 0) return false;
    pool.splice(i, 1);
  }
  return true;
}

/** Points for a word: longer words earn more (prototype: length², roughly). */
export function forgePoints(word: string): number {
  return word.length * word.length;
}

/** Prototype: a 6+ letter word 3★, else 2★; no words 1★. */
export function forgeStars(longest: number, words: number): 1 | 2 | 3 {
  return longest >= 6 ? 3 : words > 0 ? 2 : 1;
}
