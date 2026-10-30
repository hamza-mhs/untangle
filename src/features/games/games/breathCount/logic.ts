export const BREATHS = 9;
export const BREATH_IN_MS = 4000;
export const BREATH_OUT_MS = 6000;

/** Which breath and phase at game time t (9 × (4 s in + 6 s out) = 90 s). */
export function breathAt(tMs: number): {
  index: number;
  phase: 'in' | 'out';
  p: number;
  done: boolean;
} {
  const cycle = BREATH_IN_MS + BREATH_OUT_MS;
  const index = Math.floor(tMs / cycle);
  if (index >= BREATHS) return { index: BREATHS, phase: 'out', p: 1, done: true };
  const within = tMs - index * cycle;
  return within < BREATH_IN_MS
    ? { index, phase: 'in', p: within / BREATH_IN_MS, done: false }
    : { index, phase: 'out', p: (within - BREATH_IN_MS) / BREATH_OUT_MS, done: false };
}
