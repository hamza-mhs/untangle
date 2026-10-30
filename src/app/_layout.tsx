import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary, ToastHost } from '@/design/components';
import { color } from '@/design/tokens';
import { useAppFonts } from '@/design/useAppFonts';
import { useOnboardingStore } from '@/features/onboarding';
import { useAppBootstrap } from '@/lib/bootstrap';
import { DatabaseProvider } from '@/storage/db/DatabaseProvider';

/**
 * Root providers and the one navigation decision: onboarding until `onboarding.completedAt`
 * is set, then the tabs (00-foundations §3).
 */
export default function RootLayout() {
  useAppBootstrap();
  const fontsReady = useAppFonts();
  const isOnboarded = useOnboardingStore((s) => s.completedAt !== null);
  if (!fontsReady) return null;
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ErrorBoundary name="root">
          <DatabaseProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: color.bg.app },
              }}>
              <Stack.Protected guard={!isOnboarded}>
                <Stack.Screen name="(onboarding)" />
              </Stack.Protected>
              <Stack.Protected guard={isOnboarded}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="game/[gameId]"
                  options={{ animation: 'fade', gestureEnabled: false }}
                />
                <Stack.Screen name="lock" />
                <Stack.Screen name="focus" options={{ gestureEnabled: false }} />
                <Stack.Screen name="screen-time" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
              </Stack.Protected>
              {/* Opened by the accessibility service, also mid-onboarding. */}
              <Stack.Screen name="pause" options={{ animation: 'none', gestureEnabled: false }} />
              <Stack.Screen name="dev" options={{ presentation: 'modal' }} />
            </Stack>
          </DatabaseProvider>
          <ToastHost />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.app },
});
