import { rng, shuffle } from '@/lib/rng';

export const LG_SECONDS = 60;
/** Two words per round (prototype `w < 2`). */
export const LG_WORDS = 2;
/** Misses allowed per word (prototype: five marks under the wells, reset for each word). */
export const LG_MISSES = 5;
/** Keys in the rack (prototype `.slice(0, 10)`). */
export const LG_RACK = 10;
export const LG_HIT_POINTS = 10;
export const LG_SOLVE_POINTS = 50;

/** A pack item: lower-case word (4–7 letters) and a short clue. */
export type LgItem = { id: string; word: string; clue: string };

/**
 * Distractors, most common first. The prototype pads with "TRNLMDH"; that runs short for
 * words that already use several of them, so the list carries on with the next common letters.
 */
const COMMON = 'trnlmdhseaiocupgbfwyk';
/** Distractors are drawn from the first few common letters the word doesn't use. */
const DISTRACTOR_POOL = 12;

/**
 * The rack: every letter of the word once, padded with seeded common distractors to
 * `LG_RACK` keys, sorted alphabetically (prototype `pool.sort()`).
 */
export function rackFor(word: string, seed: number): string[] {
  const own = [...new Set(word.toLowerCase())];
  const need = Math.max(0, LG_RACK - own.length);
  const pool = [...COMMON].filter((c) => !own.includes(c)).slice(0, DISTRACTOR_POOL);
  const extra = shuffle(pool, rng(seed)).slice(0, need);
  return [...own, ...extra].sort();
}

export type Guess = 'hit' | 'miss' | 'none';

/** A tap on `letter`: in the word, not in it, or already tried (`none`). */
export function guess(word: string, tried: ReadonlySet<string>, letter: string): Guess {
  if (tried.has(letter)) return 'none';
  return word.includes(letter) ? 'hit' : 'miss';
}

/** The wells: each letter of the word once it has been guessed, else ''. */
export function wellLetters(word: string, tried: ReadonlySet<string>): string[] {
  return [...word].map((c) => (tried.has(c) ? c : ''));
}

/** Every letter of the word has been found. */
export function isSolved(word: string, tried: ReadonlySet<string>): boolean {
  return [...word].every((c) => tried.has(c));
}

/** Prototype top rule (`misses <= 2 ? 3 : 2`), with a 1-star band when no word was found. */
export function lgStars(solved: number, misses: number): 1 | 2 | 3 {
  if (solved === 0) return 1;
  return misses <= 2 ? 3 : 2;
}
