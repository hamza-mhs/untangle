import { Stack } from 'expo-router';

import { color } from '@/design/tokens';

/** Onboarding stack. Resume after the app was killed is handled by the welcome route. */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Screens animate their own content in (24 dp slide + fade); the header stays put.
        animation: 'none',
        contentStyle: { backgroundColor: color.bg.app },
      }}>
      <Stack.Screen name="studying" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
