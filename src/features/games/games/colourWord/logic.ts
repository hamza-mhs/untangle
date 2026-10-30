import { pick, rng } from '@/lib/rng';

export const INKS = ['red', 'blue', 'green', 'yellow'] as const;
export type Ink = (typeof INKS)[number];
export const COLOUR_TRIALS = 14;

export type ColourTrial = { word: Ink; ink: Ink };

/** 14 trials; about 80 % incongruent (the word names a different colour than its ink). */
export function colourTrials(seed: number, n = COLOUR_TRIALS): ColourTrial[] {
  const rand = rng(seed);
  return Array.from({ length: n }, () => {
    const ink = pick(INKS, rand);
    const congruent = rand() < 0.2;
    const word = congruent
      ? ink
      : pick(
          INKS.filter((c) => c !== ink),
          rand,
        );
    return { word, ink };
  });
}

export function colourStars(right: number): 1 | 2 | 3 {
  return right >= 13 ? 3 : right >= 9 ? 2 : 1;
}
