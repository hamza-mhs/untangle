import { Platform, type ViewStyle } from 'react-native';

/** Radius scale (SPEC §1.3). Use `rounded()` / `pill()` so nobody forgets the iOS curve. */
export const radius = {
  /** Inputs, icon tiles, small tiles. */
  s: 12,
  /** Cards, list groups, banners. */
  m: 16,
  /** Sheet top corners, hero tiles, the focus card. */
  l: 22,
} as const;

const curve: ViewStyle = Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {};

/** Rounded rect with the continuous ("squircle") curve on iOS. */
export function rounded(r: number): ViewStyle {
  return { borderRadius: r, ...curve };
}

/** Fully rounded pill for a given height (buttons, chips, segmented control). */
export function pill(height: number): ViewStyle {
  return { borderRadius: height / 2, ...curve };
}

/** Top corners only (sheets). */
export function roundedTop(r: number): ViewStyle {
  return { borderTopLeftRadius: r, borderTopRightRadius: r, ...curve };
}
