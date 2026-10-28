import { Stack } from 'expo-router';

import { color } from '@/design/tokens';

/** Settings is one modal with its own stack: Settings → Plan & billing (P09) → Cancel (P10). */
export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg.canvas } }}
    />
  );
}
