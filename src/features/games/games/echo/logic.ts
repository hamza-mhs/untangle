import { pick, rng, shuffle } from '@/lib/rng';

export const ECHO_SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hex'] as const;
export type EchoShape = (typeof ECHO_SHAPES)[number];
export const ECHO_ITEMS = 16;
export const ECHO_MATCHES = 5;

/** 16 shapes with exactly 5 "same as two back" positions (none in the first two). */
export function echoSequence(seed: number, n = ECHO_ITEMS, matches = ECHO_MATCHES): EchoShape[] {
  const rand = rng(seed);
  const slots = shuffle(
    Array.from({ length: n - 2 }, (_, i) => i + 2),
    rand,
  ).slice(0, matches);
  const isMatch = new Set(slots);
  const seq: EchoShape[] = [];
  for (let i = 0; i < n; i++) {
    if (isMatch.has(i)) seq.push(seq[i - 2]!);
    else {
      const avoid = i >= 2 ? seq[i - 2] : undefined;
      seq.push(
        pick(
          ECHO_SHAPES.filter((s) => s !== avoid),
          rand,
        ),
      );
    }
  }
  return seq;
}

export function echoIsMatch(seq: readonly EchoShape[], i: number): boolean {
  return i >= 2 && seq[i] === seq[i - 2];
}

export function echoStars(right: number): 1 | 2 | 3 {
  return right >= 14 ? 3 : right >= 10 ? 2 : 1;
}
