import { useEffect } from 'react';
import { AppState } from 'react-native';

import { syncDailySummaries } from '@/features/home';
import { pushLocksToNative, useLocksStore } from '@/features/locks';
import { pushSettingsToNative, useSettingsStore } from '@/features/settings';
import { startEntitlementSync, useEntitlementStore } from '@/services/purchases';

/** B.11: on launch and every return to the app, write today's (and missed days') summary. */
function syncNow() {
  void syncDailySummaries(useSettingsStore.getState().dailyGoal).catch(() => {});
}

/** Work that runs once on launch. */
export function useAppBootstrap() {
  useEffect(() => {
    const stopEntitlementSync = startEntitlementSync();
    // The native store is the source of truth for enforcement; make sure it matches the JS copy.
    pushLocksToNative(useLocksStore.getState().locks);
    pushSettingsToNative(useSettingsStore.getState().unlockMinutes);
    // Pro starting or ending changes which locks the free plan pauses.
    const stopPro = useEntitlementStore.subscribe((s, prev) => {
      if (s.entitlement.isActive !== prev.entitlement.isActive)
        pushLocksToNative(useLocksStore.getState().locks);
    });
    const t = setTimeout(syncNow, 1500);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncNow();
    });
    return () => {
      stopEntitlementSync();
      stopPro();
      clearTimeout(t);
      sub.remove();
    };
  }, []);
}
