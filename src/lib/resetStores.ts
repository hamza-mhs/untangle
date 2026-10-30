import { useFocusStore } from '@/features/focus';
import { useTrainingStore } from '@/features/games';
import { useLocksStore } from '@/features/locks';
import { useOnboardingStore, usePermissionFlow } from '@/features/onboarding';
import { usePaywallStore } from '@/features/paywall';
import { useSettingsStore } from '@/features/settings';

/** After Delete my data: every feature store back to a fresh install (Pro is kept). */
export function resetAllStores() {
  useLocksStore.setState({ locks: [], freeKeep: [] });
  useFocusStore.setState({ session: null, finished: null });
  useTrainingStore.setState({ day: null, ids: [], previous: null });
  usePaywallStore.setState({ lastShownAt: null });
  useSettingsStore.setState({
    defaultStrictness: 'gentle',
    unlockMinutes: 5,
    dailyGoal: 3,
    soundEnabled: true,
    hapticsEnabled: true,
  });
  usePermissionFlow.getState().reset();
  useOnboardingStore.getState().reset();
}
