/**
 * Colour tokens (00-foundations §4.1). Two layers: private `palette` primitives, and the
 * semantic `color` object components use. The app is black and white; colour belongs to games,
 * game categories, data and signals.
 */
const palette = {
  black: '#000000',
  ink: '#05050A',
  grey950: '#111114',
  grey925: '#16171B',
  grey900: '#18181C',
  grey875: '#1C1D22',
  grey850: '#24252A',
  grey800: '#2A2B31',
  grey700: '#3A3B42',
  grey600: '#4A4B52',
  grey500: '#5F6066',
  grey400: '#8A8B92',
  grey300: '#A9AAB2',
  white: '#FFFFFF',
  violet500: '#8B3DFF',
  violet400: '#A57BFF',
  violet900: '#3F14A3',
  mint400: '#3BE3B2',
  mint300: '#7FF2CE',
  red500: '#FF4848',
  red300: '#FF8A8A',
  amber400: '#FFC53D',
  amber300: '#FFD771',
  pink500: '#FF3D8E',
  sky500: '#22A6FF',
  cobalt500: '#4A5BFF',
  orange500: '#FF7A1F',
  mint500: '#17D9A3',
} as const;

export const color = {
  bg: {
    /** All non-game screens. */
    app: palette.black,
    /** Game screen base under the background art. */
    ink: palette.ink,
  },
  surface: {
    /** Cards, rows, tiles. */
    card: palette.grey950,
    /** Onboarding option rows and permission rows. */
    option: palette.grey925,
    /** Sheets, inputs, selected-but-not-primary. */
    raised: palette.grey900,
    /** Chips, stepper buttons, back chip. */
    control: palette.grey875,
    /** Switch track off, segmented selection. */
    controlStrong: palette.grey800,
    /** Hairlines and card borders. */
    line: 'rgba(255,255,255,0.07)',
    /** Unselected radio and checkbox rings, dividers on cards. */
    lineStrong: palette.grey850,
    /** Checkbox ring on option rows. */
    ring: palette.grey700,
    /** Translucent chip on images and dark art (back button, header chips). */
    glass: 'rgba(255,255,255,0.08)',
    /** Progress track, inactive dots. */
    track: 'rgba(255,255,255,0.12)',
  },
  text: {
    primary: palette.white,
    secondary: palette.grey400,
    /** Onboarding body copy (a touch brighter than secondary on pure black). */
    body: palette.grey300,
    tertiary: palette.grey500,
    /** Chevrons and inactive icons on cards. */
    quiet: palette.grey600,
    /** Text on white primary buttons and selected rows. */
    onLight: palette.black,
  },
  brand: {
    violet: palette.violet500,
    violetLight: palette.violet400,
    /** The brand button's bottom lip. */
    violetDeep: palette.violet900,
    violetSoft: 'rgba(139,61,255,0.18)',
  },
  signal: {
    success: palette.mint400,
    successText: palette.mint300,
    successSoft: 'rgba(59,227,178,0.13)',
    danger: palette.red500,
    dangerText: palette.red300,
    dangerSoft: 'rgba(255,72,72,0.14)',
    warning: palette.amber400,
    warningText: palette.amber300,
    warningSoft: 'rgba(255,197,61,0.08)',
    warningLine: 'rgba(255,197,61,0.2)',
  },
  game: {
    pink: palette.pink500,
    sky: palette.sky500,
    cobalt: palette.cobalt500,
    violet: palette.violet500,
    orange: palette.orange500,
    mint: palette.mint500,
    sun: palette.amber400,
    coral: palette.red500,
  },
  overlay: {
    /** Behind sheets and dialogs. */
    scrim: 'rgba(0,0,0,0.6)',
  },
} as const;

/** Focus groups (game categories) and their chip colours (00-foundations §4.1). */
export const FOCUS_GROUPS = [
  'memory',
  'attention',
  'selfControl',
  'quickDecisions',
  'logic',
  'words',
  'calm',
  'active',
] as const;
export type FocusGroup = (typeof FOCUS_GROUPS)[number];

export const focusGroupColor: Record<FocusGroup, string> = {
  memory: color.game.mint,
  attention: color.game.sky,
  selfControl: color.game.pink,
  quickDecisions: color.game.orange,
  logic: color.game.cobalt,
  words: color.game.sun,
  calm: color.game.violet,
  active: color.signal.success,
};

/** Monogram tile colours (AppIcon / SiteIcon fallbacks), picked by a hash of the name. */
export const monogramColors: readonly string[] = [
  color.game.pink,
  color.game.sky,
  color.game.cobalt,
  color.game.violet,
  color.game.orange,
  color.game.mint,
  color.game.coral,
];
