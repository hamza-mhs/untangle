import { rng } from '@/lib/rng';

/** Shared rules for the sorting games (Rule flip, Sort the stream). */
export type SortColour = 'pink' | 'blue';
export type SortShape = 'circle' | 'square';
export type SortRule = 'colour' | 'shape';
export type SortPiece = { colour: SortColour; shape: SortShape };

/** Left (0) or right (1): pink / circle go left, blue / square go right. */
export function sortSide(p: SortPiece, rule: SortRule): 0 | 1 {
  return rule === 'colour' ? (p.colour === 'pink' ? 0 : 1) : p.shape === 'circle' ? 0 : 1;
}

/** True when the two rules send the piece to different sides. */
export function conflicts(p: SortPiece): boolean {
  return sortSide(p, 'colour') !== sortSide(p, 'shape');
}

/**
 * `n` random pieces; the piece right after each rule change (`flipsAt`, 0-based) always
 * disagrees between the rules, so following the old rule is visibly wrong.
 */
export function sortPieces(seed: number, n: number, flipsAt: readonly number[]): SortPiece[] {
  const rand = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    let p: SortPiece = {
      colour: rand() < 0.5 ? 'pink' : 'blue',
      shape: rand() < 0.5 ? 'circle' : 'square',
    };
    if (flipsAt.includes(i) && !conflicts(p)) {
      p = { ...p, shape: p.shape === 'circle' ? 'square' : 'circle' };
    }
    return p;
  });
}

/** The rule in force for piece i, starting with colour and switching at each flip. */
export function ruleAt(i: number, flipsAt: readonly number[]): SortRule {
  const flips = flipsAt.filter((f) => f <= i).length;
  return flips % 2 === 0 ? 'colour' : 'shape';
}
