export const HOP_GOAL = 6;
export const HOP_LIVES = 3;
export const SWING_PERIOD_MS = 2600;
export const FLIGHT_MS = 600;
/** Landing window: planet centre within this many px of the rocket. */
export const LAND_TOLERANCE = 30;

export function planetX(tMs: number, centre: number, amplitude: number, phase = 0): number {
  return centre + amplitude * Math.sin(phase + (2 * Math.PI * tMs) / SWING_PERIOD_MS);
}

export function hopPoints(offset: number): number {
  return 20 + Math.max(0, 40 - Math.round(Math.abs(offset)));
}

export function hopStars(hops: number, lives: number): 1 | 2 | 3 {
  if (hops >= HOP_GOAL && lives === HOP_LIVES) return 3;
  return hops >= 3 ? 2 : 1;
}
