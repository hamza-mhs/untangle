export const TIME_TRIES = 5;
export const TIME_SECONDS = 45;
export const TIME_TARGET_MS = 5000;
/** The hand is visible for the first 2 s, sweeping 144° (72° per second). */
export const TIME_SHOWN_MS = 2000;
export const TIME_DEG_PER_MS = 144 / 2000;
/** No tap by this point counts as a miss for the try. */
export const TIME_GIVE_UP_MS = 8000;
/** The result line runs from 3 s to 7 s. */
export const LINE_FROM_S = 3;
export const LINE_TO_S = 7;

/** Signed error in seconds (+ late, − early). */
export function timeError(tapMs: number): number {
  return (tapMs - TIME_TARGET_MS) / 1000;
}

/** Prototype: max(5, round(100 − |err|·300)). */
export function timePoints(err: number): number {
  return Math.max(5, Math.round(100 - Math.abs(err) * 300));
}

/** Where a time lands on the 3–7 s line, 0–1, clamped. */
export function linePos(seconds: number): number {
  return Math.max(0, Math.min(1, (seconds - LINE_FROM_S) / (LINE_TO_S - LINE_FROM_S)));
}

export function timeStars(best: number): 1 | 2 | 3 {
  return best < 0.1 ? 3 : best < 0.25 ? 2 : 1;
}
