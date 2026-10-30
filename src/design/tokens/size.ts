/** Component sizes from the prototypes (dp). */
export const size = {
  /** Minimum touch target (accessibility). */
  touch: 44,
  button: { lg: 52, md: 44 },
  /** Onboarding back chip. */
  backChip: 30,
  /** Detail-screen back chip. */
  navChip: 36,
  optionRow: 50,
  chip: 32,
  listRow: 54,
  listRowIcon: 34,
  toggle: { width: 44, height: 26, knob: 20, inset: 3 },
  stepperButton: 30,
  segmented: { height: 38, inset: 3 },
  progress: { height: 3, gap: 3 },
  dot: { size: 7, active: 22 },
  checkbox: 22,
  sheetGrabber: { width: 36, height: 4 },
  tabBar: { height: 62, inset: 14, bottom: 20 },
  appIcon: { sm: 32, md: 44, lg: 56 },
  icon: { xs: 12, sm: 16, md: 20, lg: 24 },
  bannerIcon: 20,
  barChart: { height: 120, bar: 6 },
  hourChart: { height: 64 },
  ring: { stroke: 4 },
  hairline: 1,
} as const;
