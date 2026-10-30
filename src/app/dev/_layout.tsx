import { Redirect, Stack } from 'expo-router';

import { color } from '@/design/tokens';

/** Developer tools; production builds never show them. */
export default function DevLayout() {
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg.app } }}
    />
  );
}
