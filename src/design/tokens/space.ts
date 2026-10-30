/** Spacing scale (00-foundations §4.2). */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 80,
} as const;

/** Screen-level layout values from the prototypes. */
export const layout = {
  /** Horizontal gutter on onboarding screens. */
  gutterOnboarding: 24,
  /** Horizontal gutter on tab and detail screens. */
  gutterTab: 18,
  /** Padding inside cards. */
  cardPadding: 16,
  /** Onboarding header (back chip + progress) top offset below the safe area. */
  headerTop: 8,
  /** Gap between the onboarding header and the title. */
  headerGap: 24,
  /** Space kept clear above the floating tab bar. */
  tabBarClearance: 110,
} as const;
