import { randInt, rng, shuffle } from '@/lib/rng';

export const BRIDGE_SECONDS = 60;
export const BRIDGE_COUNT = 3;
/** The widest deck, in units: every bridge's gaps add up to at most this. */
export const DECK_MAX_UNITS = 12;
/** Narrowest deck, so a two-gap bridge still spans a real river. */
export const DECK_MIN_UNITS = 7;
export const GAP_MIN = 2;
export const GAP_MAX = 5;
export const FIT_POINTS = 15;
export const CROSS_POINTS = 50;

export type BridgeLevel = {
  /** Gap lengths left to right, in units. */
  gaps: number[];
  /** Beam lengths in tray order (fitting beams and decoys, shuffled). */
  tray: number[];
};

/** Gap count for bridge `index` (0-based): 2–3, then 3, then 3–4, so the round gets busier. */
function gapCount(index: number, rand: () => number): number {
  if (index <= 0) return 2 + randInt(rand, 2);
  if (index === 1) return 3;
  return 3 + randInt(rand, 2);
}

/**
 * Bridge `index` of the round for `seed`: 2–4 gaps of 2–5 units that fit the deck
 * (7–12 units in all), and a tray of the fitting beams plus 1–2 decoys, shuffled.
 *
 * Decoys never match any gap's length (they are one unit off a gap, so they look plausible).
 * That keeps "fits exactly" a unique assignment: the fitting beams are exactly the gaps'
 * lengths, so every gap has its beam, beams of equal length are interchangeable, and a
 * player can never use up the beam another gap needed.
 */
export function bridgeLevel(seed: number, index: number): BridgeLevel {
  const rand = rng((seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0);
  const n = gapCount(index, rand);
  let gaps: number[] = [];
  for (;;) {
    gaps = Array.from({ length: n }, () => GAP_MIN + randInt(rand, GAP_MAX - GAP_MIN + 1));
    const total = gaps.reduce((a, b) => a + b, 0);
    if (total >= DECK_MIN_UNITS && total <= DECK_MAX_UNITS) break;
  }
  const used = new Set(gaps);
  const near = new Set<number>();
  for (const g of gaps) for (const d of [g - 1, g + 1]) if (d >= 1 && !used.has(d)) near.add(d);
  // `near` is never empty: the shortest gap minus one (≥ 1) is shorter than every gap.
  const pool = shuffle(
    [...near].sort((a, b) => a - b),
    rand,
  );
  const decoys = pool.slice(0, Math.min(pool.length, 1 + randInt(rand, 2)));
  return { gaps, tray: shuffle([...gaps, ...decoys], rand) };
}

export function deckUnits(level: BridgeLevel): number {
  return level.gaps.reduce((a, b) => a + b, 0);
}

/** A beam fits a gap only when it is exactly as long. */
export function fits(beam: number, gap: number): boolean {
  return beam === gap;
}

export function misfitKind(beam: number, gap: number): 'short' | 'long' {
  return beam < gap ? 'short' : 'long';
}

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Lays tray beams out in rows (prototype: left to right, wrapping, 10 px apart).
 * Returns each beam's top-left inside the tray, and the rows used.
 */
export function trayLayout(
  lengths: readonly number[],
  unit: number,
  width: number,
  gap: number,
  rowH: number,
): { pos: { x: number; y: number }[]; rows: number } {
  let x = 0;
  let row = 0;
  const pos = lengths.map((len) => {
    const w = len * unit;
    if (x > 0 && x + w > width) {
      x = 0;
      row++;
    }
    const p = { x, y: row * rowH };
    x += w + gap;
    return p;
  });
  return { pos, rows: lengths.length ? row + 1 : 0 };
}

/**
 * The open gap a dropped beam lands in: the one whose centre is nearest the beam's centre,
 * as long as it is within `reach`. -1 when none is close enough.
 */
export function nearestGap(
  slots: readonly Rect[],
  filled: readonly boolean[],
  x: number,
  y: number,
  reach: number,
): number {
  let best = -1;
  let bestD = reach * reach;
  slots.forEach((s, i) => {
    if (filled[i]) return;
    const dx = s.x + s.w / 2 - x;
    const dy = s.y + s.h / 2 - y;
    const d = dx * dx + dy * dy;
    if (d <= bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** Index of the rect that contains (x, y), grown by `slop` on every side; -1 if none. */
export function hitRect(rects: readonly Rect[], x: number, y: number, slop = 0): number {
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i]!;
    if (x >= r.x - slop && x <= r.x + r.w + slop && y >= r.y - slop && y <= r.y + r.h + slop)
      return i;
  }
  return -1;
}

/** How far a beam dips under Pip (centre `c`) on a gap from `left`, `w` wide: 0 off the beam. */
export function beamDip(c: number, left: number, w: number, depth: number): number {
  if (w <= 0 || c <= left || c >= left + w) return 0;
  return depth * Math.sin(((c - left) / w) * Math.PI);
}

/** Prototype's top rule (no misfits → 3★, else 2★), plus 1★ when no bridge was built. */
export function bridgeStars(built: number, misfits: number): 1 | 2 | 3 {
  if (built <= 0) return 1;
  return misfits ? 2 : 3;
}

/** Pip's wave (prototype keyframes 0°, −25°, 10°, −25°, 0°), for progress `q` in 0–1. */
const WAVE = [0, -25, 10, -25, 0];
export function waveAngle(q: number): number {
  if (q <= 0 || q >= 1) return 0;
  const f = q * (WAVE.length - 1);
  const i = Math.floor(f);
  return WAVE[i]! + (WAVE[i + 1]! - WAVE[i]!) * (f - i);
}
