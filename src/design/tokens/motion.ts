/** Motion tokens (00-foundations §4.4). Reduce motion: fades instead of movement. */
export const motion = {
  duration: {
    instant: 120,
    fast: 200,
    base: 320,
    slow: 480,
    countdownBeat: 620,
    countdownGap: 20,
  },
  /** cubic-bezier control points, for Reanimated's `Easing.bezier(...)`. */
  easing: {
    standard: [0.2, 0.7, 0.3, 1] as const,
    pop: [0.3, 1.2, 0.5, 1] as const,
  },
  spring: {
    press: { damping: 18, stiffness: 320 },
  },
  pressScale: 0.97,
  /** Onboarding screen enter: slide distance. */
  enterOffset: 24,
} as const;
