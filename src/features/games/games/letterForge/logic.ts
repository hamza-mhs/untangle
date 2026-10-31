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

export type ForgeVerdict = 'ok' | 'short' | 'unknown' | 'repeat';

/**
 * Judges a word built in the tray: at least `FORGE_MIN` letters, in the rack's word list (the
 * round's whole dictionary) and not forged already this round.
 */
export function judgeWord(word: string, rack: Rack, found: readonly string[]): ForgeVerdict {
  const w = word.toLowerCase();
  if (w.length < FORGE_MIN) return 'short';
  if (!fromRack(w, rack.letters) || !rack.words.includes(w)) return 'unknown';
  if (found.includes(w)) return 'repeat';
  return 'ok';
}
