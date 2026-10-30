// Build-time only (tools/content): never imported by the app.
import { rng, shuffle } from '@/lib/rng';

import { shortestLadder, type Ladder } from './logic';

/**
 * Ladders between two common 4-letter words whose shortest route over the full dictionary is
 * 3–5 steps AND can be done in that many steps using only common words (so the intended
 * route never needs an obscure word). `keys` = the letters the route needs plus decoys (7).
 */
export function generateLadders(
  common: readonly string[],
  dict: ReadonlySet<string>,
  count: number,
  seed: number,
): Ladder[] {
  const rand = rng(seed);
  const commonSet = new Set(common);
  const out: Ladder[] = [];
  const seen = new Set<string>();
  const ends = new Map<string, number>();
  const words = shuffle(common, rand);
  for (let i = 0; i < words.length && out.length < count; i++) {
    for (let j = 0; j < 40 && out.length < count; j++) {
      const from = words[i]!;
      const to = words[Math.floor(rand() * words.length)]!;
      if (from === to || seen.has([from, to].sort().join('-'))) continue;
      // Spread the pack: each word starts or ends at most 3 ladders.
      if ((ends.get(from) ?? 0) >= 3 || (ends.get(to) ?? 0) >= 3) continue;
      const any = shortestLadder(from, to, dict);
      if (!any || any.length < 4 || any.length > 6) continue;
      const easy = shortestLadder(from, to, commonSet);
      if (!easy || easy.length !== any.length) continue;
      seen.add([from, to].sort().join('-'));
      ends.set(from, (ends.get(from) ?? 0) + 1);
      ends.set(to, (ends.get(to) ?? 0) + 1);
      const need = new Set<string>();
      for (let k = 1; k < easy.length; k++)
        for (let p = 0; p < 4; p++) if (easy[k]![p] !== easy[k - 1]![p]) need.add(easy[k]![p]!);
      const decoys = shuffle(
        [...'abcdeghilmnoprstuw'].filter((c) => !need.has(c)),
        rand,
      );
      const keys = [...need, ...decoys].slice(0, Math.max(7, need.size)).sort().join('');
      out.push({ id: `wb-${String(out.length + 1).padStart(4, '0')}`, from, to, path: easy, keys });
    }
  }
  return out;
}
