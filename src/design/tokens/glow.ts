import { color } from './color';

/**
 * Glow presets for `<Glow>` (FIX-visual-fidelity F1). Every value comes from the prototypes:
 * onboarding screen `glow:` defs (`untangle-onboarding-v10.html`), the app prototype's result
 * and breath CSS. Positions are fractions of the glow's box; `radius` is a fraction of its
 * width, `ry` (ellipses only) a fraction of its height.
 */

/** One gradient stop: offset along the radius (0–1), colour, alpha. */
export type GlowStop = readonly [offset: number, tint: string, alpha: number];

export type GlowSpec = {
  stops: readonly GlowStop[];
  cx: number;
  cy: number;
  radius: number;
  ry?: number;
  /** Gaussian blur (dp) on the shape, for CSS `box-shadow` halos. */
  blur?: number;
  /** Idle breathing (CSS keyframes): scales up to `scale` and fades to `opacity` at mid-cycle. */
  pulse?: { periodMs: number; scale: number; opacity: number };
};

/**
 * CSS `radial-gradient(closest-side, c, transparent)` ends at `extent` of the radius; the
 * browser fades linearly, so the midpoint stop keeps that shape with a third stop.
 */
export function cssFalloff(tint: string, alpha: number, extent = 1): GlowStop[] {
  return [
    [0, tint, alpha],
    [extent / 2, tint, alpha / 2],
    [extent, tint, 0],
  ];
}

/** The prototypes' canvas glow (`BG()`): a, a·0.32 at half, 0. */
export function canvasFalloff(tint: string, alpha: number): GlowStop[] {
  return [
    [0, tint, alpha],
    [0.5, tint, alpha * 0.32],
    [1, tint, 0],
  ];
}

/** Onboarding `.p2 .glow`: a 560 px circle on the 320 px phone, centred 42 % down. */
const onboarding = (tint: string, alpha: number): GlowSpec => ({
  stops: cssFalloff(tint, alpha),
  cx: 0.5,
  cy: 0.42,
  radius: 280 / 320,
});

const g = color.glow;

export const glow = {
  welcome: onboarding(g.violet, 0.14),
  question: onboarding(g.white, 0.035),
  yourYear: onboarding(g.red, 0.12),
  problem: onboarding(g.red, 0.1),
  hoursBack: onboarding(g.mint, 0.12),
  momentOfPause: onboarding(g.violet, 0.24),
  stepOne: onboarding(g.violet, 0.16),
  focusGrow: onboarding(g.mint, 0.12),
  paywall: onboarding(g.violet, 0.2),
  permissions: onboarding(g.violet, 0.16),
  accessibility: onboarding(g.violet, 0.14),
  pickApps: onboarding(g.violet, 0.12),
  allSet: onboarding(g.mint, 0.16),
  /** Studying `.orb .oh`: 200 px on the 320 px phone, breathing 2.6 s (`orbp`). */
  studyingOrb: {
    stops: [
      [0, g.lilac, 0.35],
      [0.55, g.violet, 0.12],
      [1, g.violet, 0],
    ],
    cx: 0.5,
    cy: 0.5,
    radius: 100 / 320,
    pulse: { periodMs: 2600, scale: 1.18, opacity: 0.75 },
  },
  /** Studying `.orb .oc` halos: `0 0 24px 8px rgba(255,255,255,.55)`, `0 0 60px 20px rgba(165,123,255,.4)`. */
  studyingCoreInner: {
    stops: [
      [0, g.white, 0.55],
      [1, g.white, 0.55],
    ],
    cx: 0.5,
    cy: 0.5,
    radius: 18 / 320,
    blur: 12,
  },
  studyingCoreOuter: {
    stops: [
      [0, g.violetLight, 0.4],
      [1, g.violetLight, 0.4],
    ],
    cx: 0.5,
    cy: 0.5,
    radius: 30 / 320,
    blur: 30,
  },
  /** Take a breath `.bcirc` halo: `box-shadow: 0 0 60px rgba(74,91,255,.35)` around the orb. */
  breathHalo: {
    stops: [
      [0, g.cobalt, 0.35],
      [1, g.cobalt, 0.35],
    ],
    cx: 0.5,
    cy: 0.5,
    radius: 0.5,
    blur: 30,
  },
  /** Take a breath orb fill: `radial-gradient(circle, rgba(74,91,255,.55), rgba(74,91,255,.08) 70%)`. */
  breathOrb: {
    stops: [
      [0, g.cobalt, 0.55],
      [0.7, g.cobalt, 0.08],
      [1, g.cobalt, 0.08],
    ],
    cx: 0.5,
    cy: 0.5,
    radius: 0.5,
  },
} satisfies Record<string, GlowSpec>;

/** Game result `.succ`: `radial-gradient(70% 45% at 50% 32%, accent 30%, transparent 70%)`. */
export function resultGlow(accent: string): GlowSpec {
  return { stops: cssFalloff(accent, 0.3, 0.7), cx: 0.5, cy: 0.32, radius: 0.7, ry: 0.45 };
}
