// Build-time only (tools/content): never imported by the app.
import { rng, shuffle } from '@/lib/rng';

import { spellable, TRAIL_WORDS, type TrailBoard } from './logic';

/**
 * Boards from common 6-letter words: the tray is five common words (3–6 letters, longest
 * first, at least two of 4+) spelled from the six beads. Beads are shuffled so the seed word
 * isn't given away.
 */
export function generateTrails(
  common: readonly string[],
  count: number,
  seed: number,
): TrailBoard[] {
  const rand = rng(seed);
  const out: TrailBoard[] = [];
  const seenLetters = new Set<string>();
  const sixes = shuffle(
    common.filter((w) => w.length === 6),
    rand,
  );
  const pool = common.filter((w) => w.length >= 3 && w.length <= 6);
  for (const six of sixes) {
    if (out.length >= count) break;
    const sorted = [...six].sort().join('');
    if (seenLetters.has(sorted)) continue;
    const fits = pool.filter((w) => spellable(w, six));
    const long = fits.filter((w) => w.length >= 4);
    if (fits.length < TRAIL_WORDS || long.length < 2) continue;
    // Prefer longer words; keep the six-letter seed only sometimes so it isn't always there.
    const ranked = shuffle(fits, rand).sort((a, b) => b.length - a.length);
    const words = (rand() < 0.5 ? ranked : ranked.filter((w) => w !== six)).slice(0, TRAIL_WORDS);
    if (words.length < TRAIL_WORDS) continue;
    seenLetters.add(sorted);
    let letters = shuffle([...six], rand).join('');
    if (letters === six) letters = [...six].reverse().join('');
    out.push({
      id: `wt-${String(out.length + 1).padStart(4, '0')}`,
      letters,
      words: words.sort((a, b) => a.length - b.length || a.localeCompare(b)),
    });
  }
  return out;
}
