import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useRulesStore } from '@/features/rules/store';
import { useEntitlementStore } from '@/services/purchases';

import { nextMoment, type PaywallMoment } from './moments';
import { usePaywallStore } from './paywallStore';
import { trialDaysElapsed, trialPhase } from './trial';
import { useTrialStore } from './trialStore';

const ROUTES: Record<Exclude<PaywallMoment, 'trialCard'>, string> = {
  day5: '/paywall/day5',
  expiry: '/paywall?from=expiry',
  wentFree: '/paywall/went-free',
  winBack: '/paywall/win-back',
};

/**
 * Home, on focus: show at most one pricing moment (P02 / P03 / P06 / P12). P01 is a card in
 * Home itself, not a route. Each moment is marked seen when shown, so it shows once.
 */
export function usePricingMoments(isEnabled: boolean) {
  useFocusEffect(
    useCallback(() => {
      if (!isEnabled) return;
      const now = Date.now();
      const trial = useTrialStore.getState();
      const { entitlement } = useEntitlementStore.getState();
      const paywall = usePaywallStore.getState();
      const moment = nextMoment({
        now,
        trial: trialPhase(trial, now),
        trialDay: trialDaysElapsed(trial, now),
        hasPurchased: entitlement.isActive,
        proEndedAt: entitlement.endedAt,
        seen: { ...paywall.seen, remindOnDay7: paywall.remindOnDay7 },
      });
      if (!moment || moment === 'trialCard') return;
      paywall.markSeen(moment);
      if (moment === 'expiry') trial.markExpiryPaywallSeen();
      // The trial ended (or Pro lapsed): apply the free plan before saying what changed.
      if (moment === 'wentFree') useRulesStore.getState().downgrade();
      router.push(ROUTES[moment] as never);
    }, [isEnabled]),
  );
}
