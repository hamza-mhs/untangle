/**
 * Native: fonts are embedded at build time by the expo-font config plugin, so they're ready
 * immediately. (Web loads them at runtime — see useAppFonts.web.ts.)
 */
export function useAppFonts(): boolean {
  return true;
}
