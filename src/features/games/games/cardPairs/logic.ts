import { rng, shuffle } from '@/lib/rng';

export const PAIRS = 6;
export const PAIR_FACES = [
  'sun',
  'moon',
  'star',
  'heart',
  'leaf',
  'drop',
  'bolt',
  'flower',
] as const;
export type Face = (typeof PAIR_FACES)[number];

/** 12 cards: 6 faces twice, shuffled. */
export function dealPairs(seed: number, pairs = PAIRS): Face[] {
  const rand = rng(seed);
  const faces = shuffle(PAIR_FACES, rand).slice(0, pairs);
  return shuffle([...faces, ...faces], rand);
}

export function pairsStars(found: number, moves: number, pairs = PAIRS): 1 | 2 | 3 {
  if (found < pairs) return 1;
  return moves <= 8 ? 3 : 2;
}
