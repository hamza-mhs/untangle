/**
 * Read-aloud matching (pack 2 SPEC §4), pure. Word-level, in order, and forgiving: a heard word
 * matches the next unread word within a short look-ahead if it's close enough (accents, endings,
 * recogniser slips). Words jumped over are "skipped" and stay grey. A page passes at ≥ 80 %.
 */

export const PASS_RATIO = 0.8;
const LOOK_AHEAD = 4;
const MIN_SIMILARITY = 0.7;

export type WordState = 'pending' | 'said' | 'skipped';

export type PageWord = { display: string; norm: string };

export type PageProgress = { states: readonly WordState[]; cursor: number };

export function normalize(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}']/gu, '')
    .replace(/'/g, '');
}

/** Splits on spaces and hyphens ("sea-shores" is two spoken words) and keeps the display text. */
export function pageWords(page: string): PageWord[] {
  return page
    .split(/\s+/)
    .flatMap((chunk) => {
      const parts = chunk.split('-').filter(Boolean);
      return parts.map((p, i) => ({
        display: i < parts.length - 1 ? `${p}-` : p,
        norm: normalize(p),
      }));
    })
    .filter((w) => w.norm.length > 0);
}

export function heardWords(transcript: string): string[] {
  return transcript
    .split(/[\s-]+/)
    .map(normalize)
    .filter(Boolean);
}

/** 0–1 similarity from Levenshtein distance; prefix matches count (recognisers clip endings). */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return 0.85;
  const m = a.length;
  const n = b.length;
  if (m === 0 || n === 0) return 0;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j]! + 1,
        cur[j - 1]! + 1,
        prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return 1 - prev[n]! / Math.max(m, n);
}

export function emptyProgress(words: readonly PageWord[]): PageProgress {
  return { states: words.map(() => 'pending'), cursor: 0 };
}

/**
 * Applies heard words on top of `from` (the progress when this recogniser segment began), so
 * interim results that get revised are re-aligned from the same starting point each time.
 */
export function alignHeard(
  words: readonly PageWord[],
  from: PageProgress,
  heard: readonly string[],
): PageProgress {
  const states = [...from.states];
  let cursor = from.cursor;
  for (const h of heard) {
    if (cursor >= words.length) break;
    const limit = Math.min(words.length, cursor + LOOK_AHEAD + 1);
    let hit = -1;
    for (let k = cursor; k < limit; k++) {
      // Short words ("a", "of") must match exactly: they're the recogniser's favourite guesses.
      const w = words[k]!.norm;
      const ok = w.length <= 2 || h.length <= 2 ? w === h : similarity(w, h) >= MIN_SIMILARITY;
      if (ok) {
        hit = k;
        break;
      }
    }
    if (hit < 0) continue;
    for (let k = cursor; k < hit; k++) states[k] = 'skipped';
    states[hit] = 'said';
    cursor = hit + 1;
  }
  return { states, cursor };
}

export function saidCount(p: PageProgress): number {
  return p.states.filter((s) => s === 'said').length;
}

export function pageDone(p: PageProgress): boolean {
  return p.cursor >= p.states.length;
}

export function pagePassed(p: PageProgress): boolean {
  return p.states.length > 0 && saidCount(p) / p.states.length >= PASS_RATIO;
}

/** OxSummary: which key ideas the spoken summary touched (keyword overlap, prefix-tolerant). */
export function keyIdeasHit(
  transcript: string,
  ideas: readonly { words: readonly string[] }[],
): boolean[] {
  const heard = heardWords(transcript);
  const text = ` ${heard.join(' ')} `;
  return ideas.map((idea) =>
    idea.words.some((w) => {
      const n = w.split(' ').map(normalize).join(' ');
      if (n.includes(' ')) return text.includes(` ${n} `);
      return heard.some((h) => h === n || (n.length >= 4 && h.startsWith(n.slice(0, -1))));
    }),
  );
}
