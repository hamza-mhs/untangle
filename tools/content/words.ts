// Word lists for the content build (Node only; never bundled into the app).
//   accept  — ENABLE words, 3–8 letters, minus the blocklist: what counts as "a real word".
//   common  — the hand-curated common.txt ∩ accept: what puzzles use as answers.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = __dirname;

function lines(file: string): string[] {
  return readFileSync(join(DIR, file), 'utf8')
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*/, '').trim())
    .filter(Boolean);
}

const BLOCK = new Set(lines('blocklist.txt').map((w) => w.toLowerCase()));
/** Roots too strong to allow even inside a longer word. */
const BLOCK_INSIDE = [
  'fuck',
  'cunt',
  'shit',
  'nigg',
  'twat',
  'wank',
  'slut',
  'whore',
  'porn',
  'jizz',
];
const SUFFIXES = ['', 's', 'es', 'ed', 'ing'];

export function isBlocked(w: string): boolean {
  if (BLOCK_INSIDE.some((r) => w.includes(r))) return true;
  for (const suf of SUFFIXES) {
    if (suf && !w.endsWith(suf)) continue;
    const stem = w.slice(0, w.length - suf.length);
    if (BLOCK.has(stem)) return true;
    // Doubled final consonant (rapped → rap), dropped e (raping → rape).
    if (suf && stem.length > 2 && stem.at(-1) === stem.at(-2) && BLOCK.has(stem.slice(0, -1)))
      return true;
    if ((suf === 'ed' || suf === 'ing') && BLOCK.has(`${stem}e`)) return true;
  }
  return false;
}

const enable = readFileSync(join(DIR, 'data', 'enable1.txt'), 'utf8')
  .split(/\r?\n/)
  .map((w) => w.trim().toLowerCase())
  .filter((w) => /^[a-z]{3,8}$/.test(w));

export const accept: ReadonlySet<string> = new Set(enable.filter((w) => !isBlocked(w)));

const commonRaw = lines('common.txt').flatMap((l) => l.toLowerCase().split(/\s+/));
export const common: readonly string[] = [...new Set(commonRaw)]
  .filter((w) => accept.has(w))
  .sort();

/** Common words that aren't in ENABLE or are blocked (printed by the build so the list stays clean). */
export const commonRejected: readonly string[] = [...new Set(commonRaw)].filter(
  (w) => !accept.has(w),
);

export function commonOfLength(n: number): string[] {
  return common.filter((w) => w.length === n);
}

export function acceptOfLength(n: number): string[] {
  return [...accept].filter((w) => w.length === n).sort();
}
