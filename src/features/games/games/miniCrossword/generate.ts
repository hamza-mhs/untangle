// Build-time only (tools/content): never imported by the app.
import { rng, shuffle } from '@/lib/rng';

import { columns, type Crossword } from './logic';

/**
 * 3×3 grids whose three rows and three columns are six different clued words. Each word is
 * used in at most `maxUse` grids (and each first row starts at most `perStart`) so the pack
 * doesn't feel samey.
 */
export function generateCrosswords(
  clues: Readonly<Record<string, string>>,
  count: number,
  seed: number,
  maxUse = 6,
  perStart = 3,
): Crossword[] {
  const rand = rng(seed);
  const words = shuffle(
    Object.keys(clues).filter((w) => /^[a-z]{3}$/.test(w)),
    rand,
  );
  const set = new Set(words);
  const prefixes = new Set(words.flatMap((w) => [w[0]!, w.slice(0, 2)]));
  const use = new Map<string, number>();
  const out: Crossword[] = [];
  const seen = new Set<string>();
  const free = (w: string) => (use.get(w) ?? 0) < maxUse;
  for (const r0 of words) {
    if (out.length >= count || !free(r0)) continue;
    let placed = 0;
    for (const r1 of shuffle(words, rand)) {
      if (placed >= perStart || !free(r0) || !free(r1) || r1 === r0) continue;
      // Columns so far must be the start of some word.
      if (![0, 1, 2].every((c) => prefixes.has(r0[c]! + r1[c]!))) continue;
      for (const r2 of words) {
        if (!free(r2) || r2 === r0 || r2 === r1) continue;
        const rows = [r0, r1, r2];
        const cols = columns(rows);
        if (!cols.every((w) => set.has(w) && free(w))) continue;
        const all = [...rows, ...cols];
        if (new Set(all).size !== 6) continue;
        const key = all.join('');
        if (seen.has(key)) continue;
        seen.add(key);
        all.forEach((w) => use.set(w, (use.get(w) ?? 0) + 1));
        out.push({
          id: `mc-${String(out.length + 1).padStart(4, '0')}`,
          rows,
          across: rows.map((w) => clues[w]!),
          down: cols.map((w) => clues[w]!),
        });
        placed++;
        break;
      }
    }
  }
  return out;
}
