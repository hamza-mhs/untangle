export const STACK_FLOORS = 14;
export const PERFECT_PX = 3;

/** Ping-pong position of the sliding slab: 0 … range, `speed` px per ms. */
export function slidePos(tMs: number, speed: number, range: number): number {
  if (range <= 0) return 0;
  const d = (tMs * speed) % (2 * range);
  return d <= range ? d : 2 * range - d;
}

export type Drop = { left: number; width: number; cut: number; perfect: boolean };

/** Dropping a slab of `width` at `left` on a top floor (`baseLeft`, `width`). */
export function dropSlab(baseLeft: number, baseWidth: number, left: number): Drop {
  if (Math.abs(left - baseLeft) <= PERFECT_PX)
    return { left: baseLeft, width: baseWidth, cut: 0, perfect: true };
  const l = Math.max(baseLeft, left);
  const r = Math.min(baseLeft + baseWidth, left + baseWidth);
  const width = Math.max(0, r - l);
  return { left: l, width, cut: baseWidth - width, perfect: false };
}

/** Slab speed (px per ms) for floor n, a little faster each floor. */
export function slabSpeed(floor: number): number {
  return 0.16 + floor * 0.012;
}

export function stackStars(floors: number): 1 | 2 | 3 {
  return floors >= 13 ? 3 : floors >= 6 ? 2 : 1;
}
