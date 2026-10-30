import type { ViewStyle } from 'react-native';

/** Shadows. Android renders `elevation`; the colours stay black on a black UI. */
export const elevation: Record<'none' | 'sheet' | 'tabBar', ViewStyle> = {
  none: {},
  sheet: { elevation: 12, shadowColor: '#000000' },
  tabBar: { elevation: 16, shadowColor: '#000000' },
};
