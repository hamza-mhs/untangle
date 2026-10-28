import type { TextStyle } from 'react-native';

/**
 * Type tokens (SPEC §1.2). Inter Tight everywhere; JetBrains Mono only for tiny uppercase
 * labels. Families are the PostScript names of the files in assets/fonts (embedded by the
 * expo-font config plugin), so the same string works on iOS and Android.
 */
export const fontFamily = {
  light: 'InterTight-Light',
  regular: 'InterTight-Regular',
  medium: 'InterTight-Medium',
  semibold: 'InterTight-SemiBold',
  bold: 'InterTight-Bold',
  mono: 'JetBrainsMono-Medium',
} as const;

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const typeScale = {
  /** OB06 "76" (SPEC: 120 / 700; line height 0.9 as designed). */
  'display.hero': { fontFamily: fontFamily.bold, fontSize: 120, lineHeight: 108, letterSpacing: -4.8 },
  /** OB06 "days" under the hero number. */
  'display.unit': { fontFamily: fontFamily.bold, fontSize: 37, lineHeight: 37, letterSpacing: -1.1 },
  'display.xl': { fontFamily: fontFamily.bold, fontSize: 78, lineHeight: 78, letterSpacing: -3 },
  'display.l': { fontFamily: fontFamily.semibold, fontSize: 60, lineHeight: 60, letterSpacing: -1.8 },
  /** OxSilence minutes ("4m"), FTimeUp letters use display.tile below. */
  'display.silence': { fontFamily: fontFamily.bold, fontSize: 128, lineHeight: 116, letterSpacing: -5 },
  'display.silenceSec': { fontFamily: fontFamily.bold, fontSize: 82, lineHeight: 82, letterSpacing: -3.3 },
  /** R1 countdown "3". */
  'display.countdown': { fontFamily: fontFamily.light, fontSize: 160, lineHeight: 160 },
  /** R2 operation "× 2", answer box, paused clock. */
  'display.op': { fontFamily: fontFamily.light, fontSize: 96, lineHeight: 96 },
  'display.answer': { fontFamily: fontFamily.light, fontSize: 64, lineHeight: 72 },
  /** Game tiles (letters, digits, target). */
  'display.tile': { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  /** Points total on Rewards. */
  'display.points': { fontFamily: fontFamily.light, fontSize: 44, lineHeight: 50, letterSpacing: -1.3 },
  /** Clarity number on Home (design: 46 / 300, the SPEC table says display.xl). */
  'display.score': { fontFamily: fontFamily.light, fontSize: 46, lineHeight: 52, letterSpacing: -1.38 },
  /** FocusCard countdown on Home. */
  'display.timer': { fontFamily: fontFamily.light, fontSize: 48, lineHeight: 48, letterSpacing: -1.44 },
  'display.m': { fontFamily: fontFamily.medium, fontSize: 48, lineHeight: 52, letterSpacing: -1.4 },
  /** "Focus done." */
  'title.xl': { fontFamily: fontFamily.bold, fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  /** Tab headers ("Block", "Plan & billing"). */
  'title.page': { fontFamily: fontFamily.bold, fontSize: 30, lineHeight: 34, letterSpacing: -0.6 },
  'title.l': { fontFamily: fontFamily.bold, fontSize: 34, lineHeight: 37, letterSpacing: -1 },
  'title.m': { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 31, letterSpacing: -0.84 },
  'title.s': { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 29, letterSpacing: -0.5 },
  /** OB08 strength names. */
  'title.option': { fontFamily: fontFamily.bold, fontSize: 27, lineHeight: 33, letterSpacing: -0.81 },
  headline: { fontFamily: fontFamily.bold, fontSize: 19, lineHeight: 24, letterSpacing: -0.3 },
  /** Large statements: OB06 body, OB12 instruction. */
  lead: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 27 },
  /** OB07 body, OB14 card titles, OB15 timeline titles. */
  'body.xl': { fontFamily: fontFamily.semibold, fontSize: 19, lineHeight: 25, letterSpacing: -0.5 },
  /** OB13 body. */
  'body.xl.regular': { fontFamily: fontFamily.regular, fontSize: 18, lineHeight: 25 },
  'body.l': { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 20, letterSpacing: -0.17 },
  /** OB07 bar labels. */
  'body.l.strong': { fontFamily: fontFamily.bold, fontSize: 17, lineHeight: 20 },
  /** Onboarding body / subtitles (onboarding-01-05 SPEC `body`). */
  'body.lead': { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 22 },
  /** Bold runs inside onboarding subtitles ("Tap **Continue**"). */
  'body.lead.strong': { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 21 },
  'body.strong': { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 20 },
  'body.s': { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  /** Chip labels (onboarding-01-05 SPEC `chip`). */
  'label.chip': { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 20, letterSpacing: -0.16 },
  /** Small labels: OB06 "At your pace", OB12 "Time left", coach pills, OB14 card subs. */
  label: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 18 },
  'label.strong': { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 18 },
  'label.bold': { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 18 },
  meta: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 17 },
  /** Stat card values. */
  stat: { fontFamily: fontFamily.semibold, fontSize: 24, lineHeight: 29, letterSpacing: -0.48 },
  'stat.s': { fontFamily: fontFamily.semibold, fontSize: 22, lineHeight: 27, letterSpacing: -0.44 },
  /** Tab bar labels. */
  'label.tab': { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16 },
  'meta.strong': { fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 17 },
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 16 },
  /** "CLARITY" under the score. */
  'caption.caps': {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
  },
  /** Stat sub-lines, footnotes, legal lines. */
  'caption.s': { fontFamily: fontFamily.regular, fontSize: 11.5, lineHeight: 16 },
  /** Strength labels on rule cards ("LOCKED"), feature-table header. */
  'overline.s': {
    fontFamily: fontFamily.semibold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.42,
    textTransform: 'uppercase',
  },
  /** "Free" / "Pro" tags. */
  'caption.strong': { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 16 },
  /** OB14 card labels ("LOCKS"). */
  overline: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.52,
    textTransform: 'uppercase',
  },
  /** Receipt lines (mono, paper). */
  receipt: { fontFamily: fontFamily.mono, fontSize: 14, lineHeight: 20 },
  'receipt.small': { fontFamily: fontFamily.mono, fontSize: 12, lineHeight: 16 },
  /** Card difficulty / check labels ("EASY", "TIMED"). */
  'mono.label': {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  /** Reading text (OvReading 28/600 in SPEC; the render uses 23). */
  reading: { fontFamily: fontFamily.semibold, fontSize: 26, lineHeight: 32, letterSpacing: -0.7 },
  micro: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof typeScale;

/** Dynamic Type caps: titles 1.3, body 1.6, display numbers 1.0 (laid out as graphics). */
export function maxFontScale(variant: TypeVariant): number {
  if (variant.startsWith('display.')) return 1;
  if (variant.startsWith('title.') || variant === 'headline') return 1.3;
  return 1.6;
}

/** Every number uses tabular figures (SPEC §1.2). Applied to all variants by <Text>. */
export const tabularNumbers = tabular;
