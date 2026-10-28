/** Motion tokens (SPEC §1.4). With Reduce Motion on: no loops, no count-ups. */
export const motion = {
  press: { scale: 0.97, spring: { damping: 18, stiffness: 300 } },
  /** Selection colour cross-fade. */
  select: 150,
  /** Progress bars. */
  progress: 250,
  /** Clarity number on change. */
  countUp: 600,
  /** Ghost idle loop. */
  ghostLoop: 8000,
  /** Mood pose cross-fade on the standing ghost. */
  poseFade: 400,
} as const;
