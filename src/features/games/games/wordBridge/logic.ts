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
