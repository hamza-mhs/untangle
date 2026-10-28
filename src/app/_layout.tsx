import { Stack } from 'expo-router';
import type { ComponentProps } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary, ToastHost } from '@/design/components';
import { color, radius } from '@/design/tokens';
import { useAppFonts } from '@/design/useAppFonts';
import { useAppBootstrap } from '@/lib/bootstrap';
import { useNotificationLinks } from '@/lib/useNotificationLinks';
import { DatabaseProvider } from '@/storage/db/DatabaseProvider';
import { AppLockGate } from '@/features/lock/AppLockGate';

/** Native sheet heights, from the designs (sheet top ÷ 844 pt frame). */
const SHEET = {
  /** E02, E09, E05, P08: actions + a short body. */
  short: 0.45,
  /** P07, E10, E07. */
  medium: 0.5,
  /** FEmergency, P02, P06. */
  tall: 0.65,
  /** FFocusStart. */
  focusStart: 0.72,
} as const;

type ScreenOptions = NonNullable<ComponentProps<typeof Stack.Screen>['options']>;

const sheet = (detent: number): ScreenOptions => ({
  presentation: 'formSheet',
  sheetAllowedDetents: [detent],
  sheetGrabberVisible: true,
  sheetCornerRadius: radius.l,
  contentStyle: { backgroundColor: color.bg.raised },
});

export default function RootLayout() {
  useAppBootstrap();
  useNotificationLinks();
  const fontsReady = useAppFonts();
  if (!fontsReady) return null;
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ErrorBoundary name="root">
          <DatabaseProvider>
            <AppLockGate>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: color.bg.canvas },
                }}>
                <Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} />
                <Stack.Screen name="(tabs)" />
                {/* Focus */}
                <Stack.Screen name="focus/start" options={sheet(SHEET.focusStart)} />
                <Stack.Screen
                  name="focus/run"
                  options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="focus/done"
                  options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen name="focus/emergency" options={sheet(SHEET.tall)} />
                <Stack.Screen name="focus/no-passes" options={sheet(SHEET.medium)} />
                <Stack.Screen name="focus/cant-lock" options={sheet(SHEET.short)} />
                {/* Rules */}
                <Stack.Screen name="rule/new" options={{ presentation: 'modal' }} />
                <Stack.Screen name="rule/[id]" options={{ presentation: 'modal' }} />
                <Stack.Screen name="rule/locked" options={sheet(SHEET.short)} />
                <Stack.Screen
                  name="shield/index"
                  options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen name="shield/spend" options={{ presentation: 'fullScreenModal' }} />
                {/* Pricing */}
                <Stack.Screen name="paywall/index" options={{ presentation: 'fullScreenModal' }} />
                <Stack.Screen name="paywall/day5" options={sheet(SHEET.tall)} />
                <Stack.Screen name="paywall/went-free" options={sheet(SHEET.tall)} />
                <Stack.Screen name="paywall/gate" options={sheet(SHEET.medium)} />
                <Stack.Screen name="paywall/limit" options={sheet(SHEET.short)} />
                <Stack.Screen name="paywall/failed" options={sheet(SHEET.short)} />
                <Stack.Screen name="paywall/restore-none" options={sheet(SHEET.medium)} />
                <Stack.Screen
                  name="paywall/pending"
                  options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="paywall/win-back"
                  options={{ presentation: 'fullScreenModal' }}
                />
                <Stack.Screen
                  name="pro/success"
                  options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
                {/* Edge + other */}
                <Stack.Screen name="notifications-off" options={sheet(SHEET.short)} />
                <Stack.Screen name="reps" options={{ presentation: 'fullScreenModal' }} />
                {/* Read aloud */}
                <Stack.Screen
                  name="reading/read"
                  options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="reading/summary"
                  options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen name="reading/mic" options={sheet(SHEET.medium)} />
                {/* Rewards */}
                <Stack.Screen name="rewards/add" options={sheet(SHEET.tall)} />
                <Stack.Screen
                  name="rewards/redeem/[id]"
                  options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
                />
                <Stack.Screen name="receipt/index" options={{ presentation: 'modal' }} />
                <Stack.Screen
                  name="lights-out/index"
                  options={{ presentation: 'fullScreenModal' }}
                />
                <Stack.Screen name="dev/kitchen-sink" />
                <Stack.Screen name="dev/menu" options={{ presentation: 'modal' }} />
              </Stack>
            </AppLockGate>
          </DatabaseProvider>
          <ToastHost />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
});
