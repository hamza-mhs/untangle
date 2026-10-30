import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Header, ListGroup, ListRow, Screen, Toggle } from '@/design/components';
import { space } from '@/design/tokens';
import { useLocksStore } from '@/features/locks';
import {
  hrefFor,
  ONBOARDING_STEPS,
  useOnboardingStore,
  usePermissionFlow,
  type OnboardingAnswers,
} from '@/features/onboarding';
import { useT } from '@/i18n';
import { resetMockBlocker } from '@/native';
import {
  MOCK_APP_SETS,
  MOCK_GRANTS,
  MOCK_OFFERINGS,
  MOCK_PURCHASES,
  useDevMocksStore,
  type MockAppSet,
  type MockGrant,
  type MockOfferings,
  type MockPurchase,
} from '@/services/devMocks';

/** Answer presets for the results screens' edge cases (10-phase1-onboarding §2.7, §2.10). */
const PRESETS: Record<string, Partial<OnboardingAnswers>> = {
  typical: {
    ageMid: 21,
    scrollHours: 2.5,
    scrollAnswer: '2to3',
    signs: ['work', 'videos', 'grabbing'],
    signsNone: false,
  },
  underOne: {
    ageMid: 39,
    scrollHours: 0.5,
    scrollAnswer: 'under1',
    signs: ['reading'],
    signsNone: false,
  },
  notSure: {
    ageMid: 29,
    scrollHours: 2.65,
    scrollAnswer: 'notSure',
    signs: ['work', 'videos', 'reading', 'grabbing', 'foggy'],
    signsNone: false,
  },
  noSigns: { ageMid: 16, scrollHours: 4.5, scrollAnswer: 'over4', signs: [], signsNone: true },
};

function cycle<T>(all: readonly T[], v: T): T {
  return all[(all.indexOf(v) + 1) % all.length] as T;
}

/**
 * Developer menu (dev builds only): jump to any screen, the kitchen sink, reset or skip
 * onboarding, force Pro. Grows with each batch (fake usage data in 1.3, paywall states in 1.5).
 */
export function DevMenu() {
  const t = useT();
  const step = useOnboardingStore((s) => s.step);
  const completedAt = useOnboardingStore((s) => s.completedAt);
  const forcePro = useDevMocksStore((s) => s.forcePro);
  const setMocks = useDevMocksStore((s) => s.set);

  const resetOnboarding = () => {
    useOnboardingStore.getState().reset();
    router.dismissAll();
    router.replace('/');
  };
  const completeOnboarding = () => {
    useOnboardingStore.getState().complete();
    router.dismissAll();
    router.replace('/');
  };
  const mocks = useDevMocksStore();
  const applyPreset = (k: string) => {
    useOnboardingStore.setState((st) => ({ answers: { ...st.answers, ...PRESETS[k] } }));
  };
  const resetPermissions = () => {
    resetMockBlocker();
    usePermissionFlow.getState().reset();
    useLocksStore.setState({ locks: [] });
  };
  const openStep = (s: (typeof ONBOARDING_STEPS)[number]) => {
    if (completedAt !== null) useOnboardingStore.setState({ completedAt: null });
    router.dismissAll();
    router.push(hrefFor(s));
  };

  return (
    <Screen
      scroll
      gutter="tab"
      testID="dev.menu"
      header={<Header title={t('dev.menu.title')} onBack={() => router.back()} />}>
      <View style={styles.body}>
        <ListGroup label={t('dev.menu.state')}>
          <ListRow
            title={completedAt ? t('dev.menu.onboardingDone') : t('dev.menu.onboardingNotDone')}
            subtitle={t('dev.menu.onboardingStep', { step })}
          />
          <ListRow
            title={t('dev.menu.forcePro')}
            trailing={
              <Toggle
                testID="dev.forcePro"
                value={forcePro}
                onChange={(v) => setMocks({ forcePro: v })}
                accessibilityLabel={t('dev.menu.forcePro')}
              />
            }
          />
          <ListRow title={t('dev.menu.resetOnboarding')} danger onPress={resetOnboarding} />
          <ListRow title={t('dev.menu.completeOnboarding')} onPress={completeOnboarding} />
        </ListGroup>
        <ListGroup>
          <ListRow
            testID="dev.kitchenSink"
            title={t('dev.menu.kitchenSink')}
            subtitle={t('dev.menu.kitchenSinkSub')}
            onPress={() => router.push('/dev/kitchen-sink')}
          />
        </ListGroup>
        <ListGroup label={t('dev.menu.mocks')}>
          <ListRow
            title={t('dev.menu.forceMock')}
            subtitle={t('dev.menu.forceMockSub')}
            trailing={
              <Toggle
                testID="dev.forceMock"
                value={mocks.forceNativeMock}
                onChange={(v) => setMocks({ forceNativeMock: v })}
                accessibilityLabel={t('dev.menu.forceMock')}
              />
            }
          />
          <ListRow
            testID="dev.mock.accessibility"
            title={t('dev.menu.mockAccessibility')}
            value={mocks.accessibility}
            onPress={() =>
              setMocks({ accessibility: cycle<MockGrant>(MOCK_GRANTS, mocks.accessibility) })
            }
          />
          <ListRow
            title={t('dev.menu.mockUsage')}
            value={mocks.usageAccess}
            onPress={() =>
              setMocks({ usageAccess: mocks.usageAccess === 'grant' ? 'deny' : 'grant' })
            }
          />
          <ListRow
            title={t('dev.menu.mockBattery')}
            value={mocks.battery}
            onPress={() => setMocks({ battery: mocks.battery === 'grant' ? 'deny' : 'grant' })}
          />
          <ListRow
            title={t('dev.menu.mockApps')}
            value={mocks.apps}
            onPress={() => setMocks({ apps: cycle<MockAppSet>(MOCK_APP_SETS, mocks.apps) })}
          />
          <ListRow title={t('dev.menu.resetPermissions')} danger onPress={resetPermissions} />
        </ListGroup>
        <ListGroup label={t('dev.menu.store')}>
          <ListRow
            testID="dev.mock.offerings"
            title={t('dev.menu.mockOfferings')}
            value={mocks.offerings}
            onPress={() =>
              setMocks({ offerings: cycle<MockOfferings>(MOCK_OFFERINGS, mocks.offerings) })
            }
          />
          <ListRow
            testID="dev.mock.purchase"
            title={t('dev.menu.mockPurchase')}
            value={mocks.purchase}
            onPress={() =>
              setMocks({ purchase: cycle<MockPurchase>(MOCK_PURCHASES, mocks.purchase) })
            }
          />
          <ListRow
            title={t('dev.menu.mockRestore')}
            value={mocks.restore}
            onPress={() => setMocks({ restore: mocks.restore === 'found' ? 'none' : 'found' })}
          />
        </ListGroup>
        <ListGroup label={t('dev.menu.presets')}>
          {Object.keys(PRESETS).map((k) => (
            <ListRow key={k} title={t(`dev.menu.preset.${k}`)} onPress={() => applyPreset(k)} />
          ))}
        </ListGroup>
        <ListGroup label={t('dev.menu.screens')}>
          {ONBOARDING_STEPS.map((s) => (
            <ListRow
              key={s}
              testID={`dev.step.${s}`}
              title={t(`onboarding.screens.${s}`)}
              value={s}
              onPress={() => openStep(s)}
            />
          ))}
        </ListGroup>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: space['2xl'], marginTop: space.lg },
});
