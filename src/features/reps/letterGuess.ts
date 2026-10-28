import type { Rng } from './rng';

/**
 * Letter guess: a hidden word, revealed one letter at a time; guess it in as few reveals as
 * possible. TODO: replace the starter list with a curated, localised list (5–7 letters, common).
 */
export const LETTER_GUESS_WORDS = [
  'anchor',
  'bridge',
  'candle',
  'desert',
  'engine',
  'forest',
  'garden',
  'harbor',
  'island',
  'jacket',
  'kettle',
  'ladder',
  'marble',
  'needle',
  'orange',
  'pencil',
  'quartz',
  'rocket',
  'saddle',
  'timber',
  'useful',
  'velvet',
  'window',
  'yellow',
  'zipper',
  'planet',
  'silver',
  'butter',
  'circle',
  'meadow',
] as const;

export type LetterGuessRound = {
  word: string;
  /** Order in which positions are revealed. */
  revealOrder: number[];
};

export function generateLetterGuess(
  rng: Rng,
  words: readonly string[] = LETTER_GUESS_WORDS,
): LetterGuessRound {
  const word = rng.pick(words);
  return { word, revealOrder: rng.shuffle([...Array(word.length).keys()]) };
}

/** The word as shown after `revealed` letters, e.g. "_a__e_". */
export function maskWord(round: LetterGuessRound, revealed: number): string {
  const shown = new Set(round.revealOrder.slice(0, revealed));
  return [...round.word].map((ch, i) => (shown.has(i) ? ch : '_')).join('');
}

export function isCorrectGuess(round: LetterGuessRound, guess: string): boolean {
  return guess.trim().toLowerCase() === round.word;
}
