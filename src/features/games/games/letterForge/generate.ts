// Build-time only (tools/content): never imported by the app.
import { rng, shuffle } from '@/lib/rng';

import { FORGE_MIN, fromRack, type Rack } from './logic';

/**
 * Racks from common 7-letter words (so a 6+ letter word always exists), with at least
 * `minWords` real words. `words` lists every accepted word the rack makes (the round checks
 * against it, so no dictionary ships with the app).
 */
export function generateRacks(
  common: readonly string[],
  accept: ReadonlySet<string>,
  count: number,
  seed: number,
  minWords = 15,
): Rack[] {
  const rand = rng(seed);
  const out: Rack[] = [];
  const seen = new Set<string>();
  const dict = [...accept].filter((w) => w.length >= FORGE_MIN && w.length <= 7);
  for (const seven of shuffle(
    common.filter((w) => w.length === 7),
    rand,
  )) {
    if (out.length >= count) break;
    const sorted = [...seven].sort().join('');
    if (seen.has(sorted)) continue;
    const words = dict.filter((w) => fromRack(w, seven)).sort();
    if (words.length < minWords) continue;
    seen.add(sorted);
    out.push({
      id: `lf-${String(out.length + 1).padStart(4, '0')}`,
      letters: shuffle([...seven], rand).join(''),
      words,
    });
  }
  return out;
}
