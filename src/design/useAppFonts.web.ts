import { useFonts } from 'expo-font';

import { fontFamily } from './tokens';

/** Web preview: register the embedded font files at runtime under the same family names. */
const FILES: Record<string, number> = {
  [fontFamily.light]: require('../../assets/fonts/InterTight-Light.ttf'),
  [fontFamily.regular]: require('../../assets/fonts/InterTight-Regular.ttf'),
  [fontFamily.medium]: require('../../assets/fonts/InterTight-Medium.ttf'),
  [fontFamily.semibold]: require('../../assets/fonts/InterTight-SemiBold.ttf'),
  [fontFamily.bold]: require('../../assets/fonts/InterTight-Bold.ttf'),
  [fontFamily.mono]: require('../../assets/fonts/JetBrainsMono-Medium.ttf'),
};

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(FILES);
  return loaded || !!error;
}
