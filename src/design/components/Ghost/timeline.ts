/**
 * SMIL timeline maths for the standing ghost, as worklets (they run on the UI thread).
 * Mirrors calcMode="spline": each keyTimes segment is eased with its own cubic-bezier.
 */

/** Where the designer's 8 s mood loop holds each mood (OB12.dc.html keyTimes). */
export const GHOST_MOOD_TIMES = { anxious: 0.1, neutralFrom: 0.3, neutralTo: 0.45, happy: 0.6 } as const;

/** CSS cubic-bezier(x1, y1, x2, y2) evaluated at progress x (0..1). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
  'worklet';
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  // Newton–Raphson on x(t) = x, falling back to bisection if the slope is flat.
  let t = x;
  for (let i = 0; i < 8; i++) {
    const err = ((ax * t + bx) * t + cx) * t - x;
    if (Math.abs(err) < 1e-5) return ((ay * t + by) * t + cy) * t;
    const slope = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(slope) < 1e-6) break;
    t -= err / slope;
  }
  let lo = 0;
  let hi = 1;
  t = x;
  for (let i = 0; i < 20; i++) {
    const v = ((ax * t + bx) * t + cx) * t;
    if (Math.abs(v - x) < 1e-5) break;
    if (v < x) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return ((ay * t + by) * t + cy) * t;
}

/** Segment index and eased fraction for timeline position t (0..1). */
export function sampleSegment(
  keyTimes: readonly number[],
  splines: readonly (readonly number[])[] | undefined,
  t: number,
): { i: number; f: number } {
  'worklet';
  const last = keyTimes.length - 1;
  if (t <= keyTimes[0]!) return { i: 0, f: 0 };
  if (t >= keyTimes[last]!) return { i: last - 1, f: 1 };
  let i = 0;
  while (i < last - 1 && t >= keyTimes[i + 1]!) i++;
  const span = keyTimes[i + 1]! - keyTimes[i]!;
  const raw = span === 0 ? 1 : (t - keyTimes[i]!) / span;
  const s = splines?.[i];
  return { i, f: s ? cubicBezier(s[0]!, s[1]!, s[2]!, s[3]!, raw) : raw };
}

export function sampleNumber(
  values: readonly number[],
  keyTimes: readonly number[],
  splines: readonly (readonly number[])[] | undefined,
  t: number,
): number {
  'worklet';
  const { i, f } = sampleSegment(keyTimes, splines, t);
  const a = values[i]!;
  const b = values[i + 1] ?? a;
  return a + (b - a) * f;
}

/** Position (0..1) inside a loop of `dur` seconds at clock time `seconds`. */
export function loopPosition(seconds: number, dur: number): number {
  'worklet';
  return dur <= 0 ? 0 : (seconds % dur) / dur;
}

/**
 * mood 0 (anxious) → 0.5 (neutral) → 1 (happy), onto the designer's timeline. The neutral
 * hold (0.3–0.45) is skipped over so every mood value above 0.5 already leans happy.
 */
export function moodToTimeline(mood: number): number {
  'worklet';
  const m = Math.min(1, Math.max(0, mood));
  const { anxious, neutralFrom, neutralTo, happy } = GHOST_MOOD_TIMES;
  if (m <= 0.5) return anxious + (m / 0.5) * (neutralFrom - anxious);
  return neutralTo + ((m - 0.5) / 0.5) * (happy - neutralTo);
}
