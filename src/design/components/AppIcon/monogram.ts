import { monogramColors } from '../../tokens';

/** Stable small hash (FNV-1a) so a name always gets the same tile colour. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function monogramColor(key: string): string {
  return monogramColors[hashString(key) % monogramColors.length]!;
}

/** Well-known apps whose usual abbreviation can't be derived from the name. */
const KNOWN: Record<string, string> = {
  instagram: 'IG',
  facebook: 'FB',
  snapchat: 'SC',
  netflix: 'NF',
  youtube: 'YT',
  tiktok: 'TT',
  whatsapp: 'WA',
};

/**
 * "Instagram" → "IG", "TikTok" → "TT", "YouTube" → "YT", "X" → "X", "reddit.com" → "RE",
 * "Google Maps" → "GM". Otherwise the first letter plus the next capital, or the first two.
 */
export function monogram(name: string): string {
  const clean = name
    .replace(/^www\./i, '')
    .replace(/\.[a-z]{2,}$/i, '')
    .trim();
  if (clean.length === 0) return '?';
  const known = KNOWN[clean.toLowerCase()];
  if (known) return known;
  const words = clean.split(/[\s._-]+/).filter(Boolean);
  if (words.length > 1) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  const w = words[0]!;
  if (w.length === 1) return w.toUpperCase();
  const capital = [...w.slice(1)].find((c) => c >= 'A' && c <= 'Z');
  return (w[0]! + (capital ?? w[1]!)).toUpperCase();
}
