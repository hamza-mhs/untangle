/** Radius scale (00-foundations §4.2). `card` (20) is the most used value. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  card: 20,
  '2xl': 22,
  '3xl': 24,
  '4xl': 28,
  pill: 999,
} as const;

/** App icons are squircle-ish tiles: 22 % of their size. */
export function iconRadius(size: number): number {
  return Math.round(size * 0.22);
}
