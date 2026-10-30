import { Redirect, useLocalSearchParams } from 'expo-router';

import { parsePauseParams, PauseScreen } from '@/features/pause';

/** untangle://pause?… — opened by the accessibility service over a blocked app (02 §4.3). */
export default function PauseRoute() {
  const params = parsePauseParams(useLocalSearchParams());
  if (!params) return <Redirect href="/" />;
  return <PauseScreen params={params} />;
}
