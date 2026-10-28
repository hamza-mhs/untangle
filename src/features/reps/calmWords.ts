import type { Rng } from './rng';

/**
 * Letter guess word list (pack 2 SPEC §4): calm, positive words with a one-line clue, by length.
 * English content; a localised build ships its own list.
 */
export type CalmWord = { word: string; clue: string };

export const CALM_WORDS: Record<5 | 6 | 7, readonly CalmWord[]> = {
  5: [
    { word: 'QUIET', clue: 'what silence feels like' },
    { word: 'PEACE', clue: 'the end of a fight' },
    { word: 'SMILE', clue: 'it costs nothing to give' },
    { word: 'LIGHT', clue: 'what a window lets in' },
    { word: 'OCEAN', clue: 'big, blue and salty' },
    { word: 'BLOOM', clue: 'what flowers do in spring' },
    { word: 'TRUST', clue: 'built slowly, lost fast' },
    { word: 'DREAM', clue: 'a story your sleep tells' },
    { word: 'RELAX', clue: 'unclench your jaw' },
    { word: 'SLEEP', clue: 'the best reset there is' },
    { word: 'CLOUD', clue: 'drifts across the sky' },
    { word: 'RIVER', clue: 'always moving, never in a rush' },
    { word: 'STILL', clue: 'not moving at all' },
    { word: 'MUSIC', clue: 'sound that makes you feel' },
  ],
  6: [
    { word: 'BREATH', clue: 'take a slow one now' },
    { word: 'GARDEN', clue: 'where things grow on purpose' },
    { word: 'GENTLE', clue: 'soft, not rough' },
    { word: 'WONDER', clue: 'how a child looks at the stars' },
    { word: 'MEADOW', clue: 'a field of grass and flowers' },
    { word: 'FOREST', clue: 'lots and lots of trees' },
    { word: 'SUNSET', clue: 'the sky going orange' },
    { word: 'SIMPLE', clue: 'the opposite of complicated' },
    { word: 'STEADY', clue: 'calm hands, even pace' },
    { word: 'WARMTH', clue: 'a blanket, a fire, a hug' },
    { word: 'NATURE', clue: 'outside, without the screens' },
    { word: 'FRIEND', clue: 'someone worth a text' },
    { word: 'SPRING', clue: 'the season things wake up' },
  ],
  7: [
    { word: 'HARMONY', clue: 'notes that sit well together' },
    { word: 'BALANCE', clue: 'neither too much nor too little' },
    { word: 'MORNING', clue: 'the first hours of the day' },
    { word: 'SUNRISE', clue: 'the sky going pink and gold' },
    { word: 'FREEDOM', clue: 'nothing pulling at you' },
    { word: 'PATIENT', clue: 'happy to wait' },
    { word: 'RAINBOW', clue: 'seven colours after rain' },
    { word: 'COMFORT', clue: 'what a warm drink gives' },
    { word: 'JOURNEY', clue: 'more about the way than the end' },
    { word: 'BREATHE', clue: 'in for four, out for six' },
    { word: 'THOUGHT', clue: 'something you can let pass' },
  ],
};

export function wordLengthFor(level: number): 5 | 6 | 7 {
  return level >= 3 ? 7 : level === 2 ? 6 : 5;
}

export function pickCalmWord(rng: Rng, level: number): CalmWord {
  return rng.pick(CALM_WORDS[wordLengthFor(level)]);
}
