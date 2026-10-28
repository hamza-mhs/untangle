import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useChallengesStore } from '@/features/challenges/store';
import { useFocusStore } from '@/features/focus/store';
import { useScoringStore } from '@/features/scoring/store';
import { useTrialStore } from '@/features/paywall/trialStore';
import { startWidgetSync } from '@/features/widgetSync';
import { refreshBlockingAccess } from '@/features/rules/accessStore';
import { useRulesStore } from '@/features/rules/store';
import { configureNotifications } from '@/services/notifications';
import { startEntitlementSync } from '@/services/purchases';

/** Work that runs on launch and every time the app returns to the foreground. */
export function runForegroundTasks(now = Date.now()) {
  useScoringStore.getState().settle(now);
  useChallengesStore.getState().ensureToday(now);
  useFocusStore.getState().dispatch({ type: 'tick', now });
  // Screen Time can be revoked in Settings at any time (EDGE_CASES): check on every foreground.
  void refreshBlockingAccess();
  // An emergency pass ran out while the app was closed: make sure the shields are back.
  const { passEndsAt, endPass } = useRulesStore.getState();
  if (passEndsAt !== null && passEndsAt <= now) endPass();
}

export function useAppBootstrap() {
  useEffect(() => {
    configureNotifications();
    const stopEntitlementSync = startEntitlementSync();
    void useTrialStore.getState().restoreFromSecureStore();
    // The ledger is the source of truth for points; rebuild the cached totals.
    useScoringStore.getState().hydrate();
    runForegroundTasks();
    const stopWidgetSync = startWidgetSync();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') runForegroundTasks();
    });
    return () => {
      sub.remove();
      stopWidgetSync();
      stopEntitlementSync();
    };
  }, []);
}
