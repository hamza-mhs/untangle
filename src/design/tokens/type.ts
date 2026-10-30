import type { TextStyle } from 'react-native';

/**
 * Typography (00-foundations §4.3). Public Sans only. Families are the file names in
 * assets/fonts (embedded by the expo-font config plugin); each weight maps to its own file,
 * never synthetic bold.
 */
export const fontFamily = {
  regular: 'PublicSans-Regular',
  medium: 'PublicSans-Medium',
  semibold: 'PublicSans-SemiBold',
  bold: 'PublicSans-Bold',
} as const;

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

/** Named by role, not size. Line heights and letter-spacing are absolute. */
export const type = {
  display: { fontFamily: fontFamily.bold, fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  titleLg: { fontFamily: fontFamily.bold, fontSize: 30, lineHeight: 33, letterSpacing: -0.6 },
  title: { fontFamily: fontFamily.bold, fontSize: 27, lineHeight: 31, letterSpacing: -0.4 },
  heading: { fontFamily: fontFamily.semibold, fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
  bodyLg: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 23, letterSpacing: 0 },
  body: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 21.7, letterSpacing: 0 },
  bodyStrong: { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 21, letterSpacing: 0 },
  button: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 20, letterSpacing: 0 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12.5, lineHeight: 16, letterSpacing: 0 },
  micro: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statXl: { fontFamily: fontFamily.bold, fontSize: 68, lineHeight: 70, letterSpacing: -1.5, ...tabular },
  statLg: { fontFamily: fontFamily.bold, fontSize: 34, lineHeight: 38, letterSpacing: -0.8, ...tabular },
  statMd: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 26, letterSpacing: -0.3, ...tabular },
} as const satisfies Record<string, TextStyle>;

export type TypeRole = keyof typeof type;

/**
 * Font scale cap per role: large titles and numbers stop growing at 1.3 so layouts survive
 * the system font size; body text scales freely up to 2 (Android's maximum).
 */
export function maxFontScale(role: TypeRole): number {
  return role === 'display' || role.startsWith('stat') || role.startsWith('title') ? 1.3 : 2;
}
