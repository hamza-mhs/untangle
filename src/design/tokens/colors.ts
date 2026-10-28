/**
 * Colour tokens (SPEC §1.1). Two layers: `palette` primitives stay private to this folder;
 * components import only the semantic `color` object. Renaming a colour = one line here.
 */
const palette = {
  black: '#000000',
  white: '#FFFFFF',
  grey050: '#CFCFCF',
  grey400: '#8C8C8C',
  grey500: '#6E6E6E',
  grey800: '#3A3A3C',
  grey850: '#2E2E2E',
  grey875: '#2C2C2E',
  grey900: '#222222',
  grey925: '#1C1C1E',
  grey950: '#121214',
  yellow500: '#E9F21F',
  yellow900: '#3A3A1A',
  yellow700Text: '#8C8C5A',
  green500: '#30D158',
  amber500: '#FFB224',
  red500: '#FF453A',
  coral500: '#F45C55',
  coral950: '#3A1A18',
  coral800: '#6A2A26',
  amber950: '#2A1B0A',
  amber800: '#5A3A12',
  green950: '#12321C',
  green800: '#1E5A30',
  grey700: '#48484A',
  grey300: '#AEAEB2',
  grey910: '#242426',
  black15: 'rgba(0,0,0,0.15)',
  paper: '#F2F1EC',
  ink: '#111111',
  grey925Soft: '#161616',
  grey450: '#5A5A5A',
  orange40: 'rgba(255,123,47,0.4)',
  black12: 'rgba(0,0,0,0.12)',
  pink300: '#F79BC9',
  sky200: '#A9D4FF',
  peri500: '#6F7EF8',
  mint500: '#24CF6C',
  orange500: '#FF7B2F',
  iosBlue: '#0A84FF',
  iosDialog: '#2A2A2C',
  iosDialogBody: '#C7C7CC',
  iosSeparator: '#38383A',
  iosChevron: '#5A5A5E',
  yellowTint12: 'rgba(233,242,31,0.12)',
  overlay62: 'rgba(0,0,0,0.62)',
  white08: 'rgba(255,255,255,0.08)',
  whiteOpaque: '#FFFFFFFF',
  whiteClear: '#FFFFFF00',
  transparent: 'transparent',
} as const;

export const color = {
  bg: {
    canvas: palette.black,
    surface: palette.grey950,
    raised: palette.grey925,
    raisedHigh: palette.grey875,
    overlay: palette.overlay62,
    /** Onboarding progress track. */
    track: palette.grey900,
    transparent: palette.transparent,
  },
  border: {
    hairline: palette.grey875,
    control: palette.grey800,
    /** Onboarding back-button ring (2 pt) and dashed coach frames. */
    subtle: palette.grey850,
    /** Empty radio rings, sheet grabber, app-tile inset ring. */
    strong: palette.grey700,
  },
  text: {
    primary: palette.white,
    secondary: palette.grey050,
    muted: palette.grey400,
    faint: palette.grey500,
    onAccent: palette.black,
  },
  accent: {
    primary: palette.yellow500,
    /** Highlighted row inside the mock picker (OB10). */
    primaryTint: palette.yellowTint12,
    primaryMuted: palette.yellow900,
    primaryMutedText: palette.yellow700Text,
  },
  status: {
    success: palette.green500,
    warning: palette.amber500,
    danger: palette.red500,
    dangerSoft: palette.coral500,
    dangerSoftBg: palette.coral950,
    dangerSoftRing: palette.coral800,
    /** Grace banner (P11). */
    warningSoftBg: palette.amber950,
    warningSoftRing: palette.amber800,
    /** Restored toast (E08), "Active" plan pill (P09). */
    successSoftBg: palette.green950,
    successSoftRing: palette.green800,
  },
  mood: {
    pink: palette.pink300,
    sky: palette.sky200,
    peri: palette.peri500,
    green: palette.mint500,
    orange: palette.orange500,
  },
  /** Only inside the mock iOS system dialogs (OB09–OB11). Never in our UI. */
  ios: {
    link: palette.iosBlue,
    dialog: palette.iosDialog,
    dialogBody: palette.iosDialogBody,
    separator: palette.iosSeparator,
    chevron: palette.iosChevron,
  },
  /** Check types on challenge cards (pack 2 SPEC §1). */
  challenge: {
    timed: palette.yellow500,
    yourWord: palette.sky200,
    verified: palette.green500,
  },
  /** Everything in the read-aloud flow: CTA, mic, progress, idea chips. */
  read: palette.orange500,
  /** One colour per game; its Start button, chips, lives and highlights all use it. */
  game: {
    word: palette.pink300,
    number: palette.yellow500,
    memory: palette.sky200,
  },
  /** Answer boxes (R3 / R4). */
  feedback: {
    rightBg: palette.green950,
    rightBorder: palette.green500,
    wrongBg: palette.coral950,
    wrongBorder: palette.coral500,
  },
  /** The evening receipt only. */
  paper: palette.paper,
  ink: palette.ink,
  /** Words not yet read / unconfirmed transcript (OvReading, OxSummary). */
  reading: { pending: palette.grey800, unsure: palette.grey450 },
  /** Decorative layers (star field). */
  effect: {
    star: palette.white,
    starLine: palette.white08,
    maskOpaque: palette.whiteOpaque,
    maskClear: palette.whiteClear,
  },
  /** Light surfaces (white CTA). */
  light: {
    surface: palette.white,
  },
  /** Layers drawn on top of accent (yellow) surfaces. */
  onAccent: {
    track: palette.black15,
    tint: palette.black12,
  },
  /** Focus progress track on the canvas (FFocusRun). */
  track: { focus: palette.grey910 },
  /** Secondary text inside the iOS shield preview. */
  shield: { subtitle: palette.grey300 },
} as const;

export type MoodColor = keyof typeof color.mood;

/** Clarity colour is a function, not a token (SPEC §1.1). */
export function clarityColor(score: number): string {
  if (score < 40) return color.status.danger;
  if (score < 70) return color.status.warning;
  return color.status.success;
}
