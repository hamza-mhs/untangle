export const BRIDGE_SECONDS = 60;
export const BRIDGE_LEN = 4;

/** A ladder from `from` to `to`; `path` is one shortest route (both ends included). */
export type Ladder = { id: string; from: string; to: string; path: string[]; keys: string };

/** True when a and b differ in exactly one position. */
export function oneApart(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i] && ++d > 1) return false;
  return d === 1;
}

/** Shortest ladder between two words over `dict` (BFS), or null. */
export function shortestLadder(
  from: string,
  to: string,
  dict: ReadonlySet<string>,
): string[] | null {
  if (from === to) return [from];
  const prev = new Map<string, string>([[from, '']]);
  let frontier = [from];
  const abc = 'abcdefghijklmnopqrstuvwxyz';
  while (frontier.length) {
    const next: string[] = [];
    for (const w of frontier) {
      for (let i = 0; i < w.length; i++)
        for (const ch of abc) {
          if (ch === w[i]) continue;
          const v = w.slice(0, i) + ch + w.slice(i + 1);
          if (!dict.has(v) || prev.has(v)) continue;
          prev.set(v, w);
          if (v === to) {
            const out = [v];
            for (let p = w; p; p = prev.get(p)!) out.push(p);
            return out.reverse();
          }
          next.push(v);
        }
    }
    frontier = next;
  }
  return null;
}

/** A valid ladder: real words throughout, one letter changed per step. */
export function isLadder(path: readonly string[], dict: ReadonlySet<string>): boolean {
  return (
    path.every((w) => dict.has(w)) && path.every((w, i) => i === 0 || oneApart(path[i - 1]!, w))
  );
}

/** Prototype: no non-words 3★, else 2★; unfinished 1★. */
export function bridgeStars(bad: number, done: boolean): 1 | 2 | 3 {
  return !done ? 1 : bad ? 2 : 3;
}

/** Prototype: +20 for each rung that locks, +50 when the bridge is done. */
export const STEP_POINTS = 20;
export const BRIDGE_POINTS = 50;

/** `word` with the letter at `pos` swapped for `ch`. */
export function swapLetter(word: string, pos: number, ch: string): string {
  return word.slice(0, pos) + ch + word.slice(pos + 1);
}

export type StepVerdict = 'word' | 'notWord' | 'repeat';

/**
 * Judges a new rung `next` built from the rung above (one letter changed by construction).
 * A word already on the ladder is turned away without counting as a non-word.
 */
export function judgeStep(
  next: string,
  ladder: readonly string[],
  dict: ReadonlySet<string>,
): StepVerdict {
  if (ladder.includes(next)) return 'repeat';
  return dict.has(next) ? 'word' : 'notWord';
}

/** The bridge is done once a rung is the bottom word or one letter away from it. */
export function isBridged(word: string, to: string): boolean {
  return word === to || oneApart(word, to);
}

/**
 * Steps a finished ladder took: `ladder` is every word so far (top word included). When the
 * last rung is one letter off the bottom word, that final change counts as a step too.
 */
export function bridgeSteps(ladder: readonly string[], to: string): number {
  const last = ladder.at(-1);
  return ladder.length - 1 + (last === to ? 0 : 1);
}

/**
 * Middle rungs to show: the shortest route's count, plus one more whenever the player has
 * used them all up and is still building.
 */
export function middleRungs(minMiddle: number, locked: number, done: boolean): number {
  return Math.max(minMiddle, locked + (done ? 0 : 1));
}
