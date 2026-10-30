import { pick, randInt, rng, shuffle } from '@/lib/rng';

export const MATHS_TRIALS = 10;
export const MATHS_SECONDS = 30;
/** Per-question ring (prototype qT = 4.5 s). */
export const MATHS_RING_MS = 4500;

export type MathsOp = '+' | '−' | '×';
export type MathsTrial = { a: number; b: number; op: MathsOp; answer: number; options: number[] };

function one(rand: () => number): MathsTrial {
  const op = pick(['+', '−', '×'] as const, rand);
  let a: number;
  let b: number;
  let answer: number;
  if (op === '×') {
    a = 3 + randInt(rand, 10);
    b = 2 + randInt(rand, 8);
    answer = a * b;
  } else if (op === '+') {
    a = 12 + randInt(rand, 60);
    b = 5 + randInt(rand, 30);
    answer = a + b;
  } else {
    a = 30 + randInt(rand, 60);
    b = 5 + randInt(rand, 25);
    answer = a - b;
  }
  // Prototype distractors: near misses and place-value slips.
  const raw = [
    answer,
    answer + pick([1, 2, 10], rand),
    answer - pick([1, 3, 10], rand),
    answer + pick([4, 11, 12], rand),
  ];
  const opts = raw.filter((v, i, s) => s.indexOf(v) === i);
  while (opts.length < 4) opts.push(answer + opts.length * 7);
  return { a, b, op, answer, options: shuffle(opts, rand) };
}

export function mathsTrials(seed: number, n = MATHS_TRIALS): MathsTrial[] {
  const rand = rng(seed);
  return Array.from({ length: n }, () => one(rand));
}

export function mathsPoints(streak: number): number {
  return 10 + Math.max(0, streak - 1) * 5;
}

export function mathsStars(right: number): 1 | 2 | 3 {
  return right >= 9 ? 3 : right >= 6 ? 2 : 1;
}
