import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useOnboardingStore } from '../onboardingStore';

/** Home: E02 once, on the first open after OB11 was denied. Never again after that. */
export function useNotificationsOffSheet() {
  const isPending = useOnboardingStore((s) => s.isNotificationsSheetPending);
  const markShown = useOnboardingStore((s) => s.markNotificationsSheetShown);
  // Focus (not mount): the router is ready and Home is actually on screen.
  useFocusEffect(
    useCallback(() => {
      if (!isPending) return;
      markShown();
      router.push('/notifications-off');
    }, [isPending, markShown]),
  );
}
