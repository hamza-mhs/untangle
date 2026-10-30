export const URGE_MS = 75_000;
/** Wave height 0–1 over the urge: rises to a peak at 40 %, then eases away. */
export function urgeLevel(tMs: number, totalMs = URGE_MS): number {
  const x = Math.min(1, Math.max(0, tMs / totalMs));
  return x < 0.4
    ? Math.sin((x / 0.4) * (Math.PI / 2))
    : Math.cos(((x - 0.4) / 0.6) * (Math.PI / 2));
}

export function urgeStage(
  tMs: number,
  totalMs = URGE_MS,
): 'notice' | 'rising' | 'peak' | 'falling' | 'gone' {
  const x = tMs / totalMs;
  if (x < 0.12) return 'notice';
  if (x < 0.34) return 'rising';
  if (x < 0.5) return 'peak';
  if (x < 0.9) return 'falling';
  return 'gone';
}
