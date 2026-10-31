export const TRAIL_SECONDS = 60;
export const TRAIL_WORDS = 5;

/** Six letter beads and the five tray words they spell. */
export type TrailBoard = { id: string; letters: string; words: string[] };

/** Can `word` be spelled from `letters`, each bead used at most once? */
export function spellable(word: string, letters: string): boolean {
  const pool = [...letters];
  for (const ch of word) {
    const i = pool.indexOf(ch);
    if (i < 0) return false;
    pool.splice(i, 1);
  }
  return true;
}

/** Prototype: all five found 3★, else 2★; none found 1★. */
export function trailStars(found: number): 1 | 2 | 3 {
  return found >= TRAIL_WORDS ? 3 : found > 0 ? 2 : 1;
}

/** Points for a tray word: 10 per letter (prototype `w.length * 10`). */
export const TRAIL_LETTER_POINTS = 10;
/** Words this long get the "Long one" cheer. */
export const TRAIL_LONG_WORD = 5;

export function wordPoints(word: string): number {
  return word.length * TRAIL_LETTER_POINTS;
}

/** The tray, shortest words first (alphabetical within a length). */
export function trayOrder(words: readonly string[]): string[] {
  return [...words].sort((a, b) => a.length - b.length || a.localeCompare(b));
}

/** Six bead centres on a ring, the first at the top, going clockwise (prototype `bp`). */
export function beadPoints(cx: number, cy: number, r: number, n = 6): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / n;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

export type SlideStep = 'start' | 'add' | 'back' | 'same';

/**
 * The finger reached bead `i` while sliding. Each bead is used at most once per word;
 * sliding back onto the previous bead takes the last letter off; any other used bead is
 * ignored.
 */
export function slideBead(path: readonly number[], i: number): { path: number[]; step: SlideStep } {
  if (!path.length) return { path: [i], step: 'start' };
  if (path.at(-1) === i) return { path: [...path], step: 'same' };
  if (path.length > 1 && path.at(-2) === i) return { path: path.slice(0, -1), step: 'back' };
  if (path.includes(i)) return { path: [...path], step: 'same' };
  return { path: [...path, i], step: 'add' };
}

export type TapStep = 'start' | 'add' | 'back' | 'try';

/**
 * Bead `i` was tapped (the TalkBack / no-drag path): new beads add a letter, the last bead
 * again tries the word, an earlier bead of the word takes the letters after it off.
 */
export function tapBead(path: readonly number[], i: number): { path: number[]; step: TapStep } {
  if (!path.length) return { path: [i], step: 'start' };
  if (path.at(-1) === i) return { path: [...path], step: 'try' };
  const k = path.indexOf(i);
  if (k >= 0) return { path: path.slice(0, k + 1), step: 'back' };
  return { path: [...path, i], step: 'add' };
}

export type Verdict = 'found' | 'again' | 'miss';

/** A tray word not found yet, a tray word already found, or anything else. */
export function judgeWord(
  word: string,
  tray: readonly string[],
  found: readonly string[],
): Verdict {
  if (!tray.includes(word)) return 'miss';
  return found.includes(word) ? 'again' : 'found';
}

/** Width of a row of `n` wells of edge `well` with `gap` between them. */
export function wordWidth(n: number, well: number, gap: number): number {
  return n * well + Math.max(0, n - 1) * gap;
}

/**
 * Lays the tray words (by length) into centred rows no wider than `maxWidth`, greedily in
 * order. Returns word indices per row.
 */
export function packTray(
  lengths: readonly number[],
  maxWidth: number,
  well: number,
  gap: number,
  wordGap: number,
): number[][] {
  const rows: number[][] = [];
  let used = 0;
  lengths.forEach((n, i) => {
    const w = wordWidth(n, well, gap);
    const row = rows.at(-1);
    if (row && used + wordGap + w <= maxWidth) {
      row.push(i);
      used += wordGap + w;
    } else {
      rows.push([i]);
      used = w;
    }
  });
  return rows;
}

/**
 * The largest well edge (from `largest` down to `smallest`) whose packed tray fits in
 * `maxWidth` × `maxHeight`; `smallest` if none does.
 */
export function trayWell(
  lengths: readonly number[],
  maxWidth: number,
  maxHeight: number,
  gap: number,
  wordGap: number,
  rowGap: number,
  largest: number,
  smallest: number,
): number {
  for (let s = Math.floor(largest); s > smallest; s--) {
    if (lengths.some((n) => wordWidth(n, s, gap) > maxWidth)) continue;
    const rows = packTray(lengths, maxWidth, s, gap, wordGap).length;
    if (rows * s + (rows - 1) * rowGap <= maxHeight) return s;
  }
  return smallest;
}
