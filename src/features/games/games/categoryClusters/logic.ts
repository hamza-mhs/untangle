import { rng, shuffle } from '@/lib/rng';

/** Category clusters (BATCH-3.3 §Category clusters): 12 words, 3 hidden groups of 4. */

export const CC_SECONDS = 60;
/** Prototype `livesUI(P, 4)`. */
export const CC_LIVES = 4;
export const CC_GROUP_SIZE = 4;
export const CC_GROUPS = 3;
/** Prototype `P.addScore(60)` per group found. */
export const CC_GROUP_POINTS = 60;

export type CcGroup = { name: string; words: string[] };
export type CcPuzzle = {
  id: string;
  groups: CcGroup[];
  /** The word that also fits a second group (the trap). */
  herring: { word: string; alsoFits: string };
};

export type CcPick = 'group' | 'oneAway' | 'miss';

/** Index of the group a word belongs to, or -1. */
export function groupOf(puzzle: CcPuzzle, word: string): number {
  return puzzle.groups.findIndex((g) => g.words.includes(word));
}

/** The 12 words in a seeded order, so a replayed seed deals the same board. */
export function dealWords(puzzle: CcPuzzle, seed: number): string[] {
  return shuffle(
    puzzle.groups.flatMap((g) => g.words),
    rng(seed),
  );
}

/** How many of the picked words share the most common group, and which group that is. */
function majority(puzzle: CcPuzzle, picked: readonly string[]): { group: number; n: number } {
  const counts = new Map<number, number>();
  for (const w of picked) {
    const g = groupOf(puzzle, w);
    if (g >= 0) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  let best = { group: -1, n: 0 };
  for (const [group, n] of counts) if (n > best.n) best = { group, n };
  return best;
}

/** Judges a pick of four: a whole group, three of one group ("One away"), or a miss. */
export function checkPick(puzzle: CcPuzzle, picked: readonly string[]): CcPick {
  if (picked.length !== CC_GROUP_SIZE || new Set(picked).size !== CC_GROUP_SIZE) return 'miss';
  const { n } = majority(puzzle, picked);
  if (n === CC_GROUP_SIZE) return 'group';
  if (n === CC_GROUP_SIZE - 1) return 'oneAway';
  return 'miss';
}

/** The group a correct pick found (call after `checkPick` says 'group'). */
export function pickedGroup(puzzle: CcPuzzle, picked: readonly string[]): number {
  return majority(puzzle, picked).group;
}

/**
 * The red herring, when it is the odd one out of a "One away" pick whose other three are the
 * herring's look-alike group (prototype: "One away. Plum is a fruit too"). Otherwise null.
 */
export function herringTrap(puzzle: CcPuzzle, picked: readonly string[]): string | null {
  if (checkPick(puzzle, picked) !== 'oneAway') return null;
  const { word, alsoFits } = puzzle.herring;
  if (!picked.includes(word)) return null;
  const { group } = majority(puzzle, picked);
  return puzzle.groups[group]?.name === alsoFits ? word : null;
}

/**
 * Groups still hidden once `found` are solved. With all but one found, the rest must be the
 * last group, so the round solves it for the player.
 */
export function unsolved(puzzle: CcPuzzle, found: readonly number[]): number[] {
  return puzzle.groups.map((_, i) => i).filter((i) => !found.includes(i));
}

/** Prototype: 3★ with no slips, 2★ with slips; an unfinished board gets 1★. */
export function ccStars(solved: number, slips: number): 1 | 2 | 3 {
  if (solved < CC_GROUPS) return 1;
  return slips ? 2 : 3;
}
