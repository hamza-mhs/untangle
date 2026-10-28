import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip, ListGroup, ListRow, Text } from '@/design/components';
import { space } from '@/design/tokens';
import { resetOnboardingNavigation } from '@/features/onboarding/navigation';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { useSettingsStore } from '@/features/settings/store';
import { useT } from '@/i18n';
import {
  HOME_FIXTURES,
  MOCK_BILLING,
  MOCK_OFFERINGS,
  MOCK_PURCHASES,
  useDevMocksStore,
} from '@/services/devMocks';
import { refreshMockEntitlement } from '@/services/purchases';

/**
 * Dev-only switches for the mock services, so every state and failure path can be walked on an
 * emulator: Screen Time, picker, notifications, sensor, all Home states, paywall offerings,
 * purchase outcomes, restore and billing. (Developer tooling: labels are not product copy.)
 */
export function DevMockControls() {
  const t = useT();
  const m = useDevMocksStore();

  const restartOnboarding = () => {
    useOnboardingStore.getState().reset();
    useSettingsStore.getState().setOnboarded(false);
    resetOnboardingNavigation();
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <Group label={t('dev.mockScreenTime')}>
        {(['approve', 'deny'] as const).map((v) => (
          <Chip
            key={v}
            label={v}
            selected={m.screenTime === v}
            onPress={() => m.set({ screenTime: v })}
          />
        ))}
        {(['approved', 'denied', 'notDetermined'] as const).map((v) => (
          <Chip
            key={v}
            label={v}
            selected={m.authStatus === v}
            onPress={() => m.set({ authStatus: v })}
          />
        ))}
      </Group>
      <Group label={t('dev.mockPicker')}>
        {(['select', 'cancel'] as const).map((v) => (
          <Chip key={v} label={v} selected={m.picker === v} onPress={() => m.set({ picker: v })} />
        ))}
      </Group>
      <Group label={t('dev.mockNotifications')}>
        {(['system', 'allow', 'deny'] as const).map((v) => (
          <Chip
            key={v}
            label={v}
            selected={m.notifications === v}
            onPress={() => m.set({ notifications: v })}
          />
        ))}
      </Group>
      <Group label={t('dev.mockSensor')}>
        {(['system', 'none'] as const).map((v) => (
          <Chip key={v} label={v} selected={m.sensor === v} onPress={() => m.set({ sensor: v })} />
        ))}
      </Group>
      <Group label={t('dev.mockHome')}>
        {HOME_FIXTURES.map((v) => (
          <Chip key={v} label={v} selected={m.home === v} onPress={() => m.set({ home: v })} />
        ))}
      </Group>
      <Group label={t('dev.mockOfferings')}>
        {MOCK_OFFERINGS.map((v) => (
          <Chip
            key={v}
            label={v}
            selected={m.offerings === v}
            onPress={() => m.set({ offerings: v })}
          />
        ))}
      </Group>
      <Group label={t('dev.mockPurchase')}>
        {MOCK_PURCHASES.map((v) => (
          <Chip
            key={v}
            label={v}
            selected={m.purchase === v}
            onPress={() => m.set({ purchase: v })}
          />
        ))}
      </Group>
      <Group label={t('dev.mockRestore')}>
        {(['found', 'none'] as const).map((v) => (
          <Chip
            key={v}
            label={v}
            selected={m.restore === v}
            onPress={() => m.set({ restore: v })}
          />
        ))}
      </Group>
      <Group label={t('dev.mockBilling')}>
        {MOCK_BILLING.map((v) => (
          <Chip
            key={v}
            label={v}
            selected={m.billing === v}
            onPress={() => {
              m.set({ billing: v });
              refreshMockEntitlement();
            }}
          />
        ))}
      </Group>
      <ListGroup>
        <ListRow title={t('dev.resetOnboarding')} onPress={restartOnboarding} />
      </ListGroup>
    </View>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="meta" tone="muted">
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.lg },
  group: { gap: space.sm },
  chips: { gap: space.sm },
});
