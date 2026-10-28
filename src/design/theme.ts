import { color, layout, motion, radius, size, space, typeScale } from './tokens';

const theme = { color, layout, motion, radius, size, space, type: typeScale } as const;

export type Theme = typeof theme;

/** Semantic tokens for components (dark-only app, so this is static). */
export function useTheme(): Theme {
  return theme;
}
