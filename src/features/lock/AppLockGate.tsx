import * as LocalAuthentication from 'expo-local-authentication';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { Ghost, Icon, PrimaryButton, Text } from '@/design/components';
import { color, layout, size, space } from '@/design/tokens';
import { useSettingsStore } from '@/features/settings/store';
import { t, useT } from '@/i18n';

/** Coming back within this window (a picker, a share sheet, a quick switch) doesn't re-lock. */
const GRACE_MS = 30_000;

export type LockSupport = 'ok' | 'noHardware' | 'notEnrolled';

export async function lockSupport(): Promise<LockSupport> {
  if (!(await LocalAuthentication.hasHardwareAsync())) return 'noHardware';
  if (!(await LocalAuthentication.isEnrolledAsync())) return 'notEnrolled';
  return 'ok';
}

/** Biometrics, falling back to the device passcode (EDGE_CASES: biometrics fail). */
export async function authenticate(): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: t('lock.prompt'),
      cancelLabel: t('common.cancel'),
      disableDeviceFallback: false,
    });
    return r.success;
  } catch {
    return false;
  }
}

/**
 * App lock (FSettings › Privacy): when on, the app opens behind a lock and asks again after
 * it's been in the background for more than GRACE_MS. The content stays mounted underneath so
 * nothing in progress (a focus session, a rep) is lost.
 */
export function AppLockGate({ children }: { children: ReactNode }) {
  const tr = useT();
  const isEnabled = useSettingsStore((s) => s.appLock);
  const [isLocked, setIsLocked] = useState(() => useSettingsStore.getState().appLock);
  const backgroundedAt = useRef<number | null>(null);
  const isAsking = useRef(false);

  const unlock = async () => {
    if (isAsking.current) return;
    isAsking.current = true;
    const ok = await authenticate();
    isAsking.current = false;
    if (ok) setIsLocked(false);
  };

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (!useSettingsStore.getState().appLock || isAsking.current) return;
      if (state === 'background') backgroundedAt.current = Date.now();
      if (state === 'active' && backgroundedAt.current !== null) {
        if (Date.now() - backgroundedAt.current > GRACE_MS) {
          setIsLocked(true);
          void unlock();
        }
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, []);

  // Ask straight away on launch.
  useEffect(() => {
    if (!useSettingsStore.getState().appLock) return;
    isAsking.current = true;
    void authenticate().then((ok) => {
      isAsking.current = false;
      if (ok) setIsLocked(false);
    });
  }, []);

  return (
    <View style={styles.root}>
      {children}
      {isEnabled && isLocked ? (
        <View style={styles.cover} accessibilityViewIsModal>
          <Ghost mood={0.5} width={size.watchTile * 0.5} />
          <Icon name="lock" size={size.icon.lg} color={color.text.muted} />
          <Text variant="title.m" align="center" accessibilityRole="header">
            {tr('lock.title')}
          </Text>
          <View style={styles.button}>
            <PrimaryButton
              testID="lock.unlock"
              label={tr('lock.unlock')}
              icon="fingerprint"
              onPress={() => void unlock()}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cover: {
    ...StyleSheet.absoluteFill,
    backgroundColor: color.bg.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    paddingHorizontal: layout.onboarding.optionsX,
  },
  button: { alignSelf: 'stretch', marginTop: space.xl },
});
