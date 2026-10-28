import { useState } from 'react';

import { useEntitlementStore } from '@/services/purchases';

import { hasProAccess, trialPhase, type TrialPhase } from './trial';
import { useTrialStore } from './trialStore';

export type ProStatus = {
  /** Pro features unlocked (paid OR inside the reverse trial). Gate features on this. */
  isPro: boolean;
  /** Paid through the store (RevenueCat `pro` entitlement). */
  hasPurchased: boolean;
  trial: TrialPhase;
};

/**
 * Entitlement hook: the cached RevenueCat entitlement (kept in sync by startEntitlementSync)
 * plus the local reverse trial. `now` defaults to the mount time so render stays pure; screens
 * remount often enough for day-level phases.
 */
export function usePro(now?: number): ProStatus {
  const [mountedAt] = useState(() => Date.now());
  const at = now ?? mountedAt;
  const startedAt = useTrialStore((s) => s.startedAt);
  const startDay = useTrialStore((s) => s.startDay);
  const hasPurchased = useEntitlementStore((s) => s.entitlement.isActive);
  const trial = { startedAt, startDay: startDay ?? null, expiryPaywallSeen: false };
  return {
    isPro: hasProAccess(trial, at, hasPurchased),
    hasPurchased,
    trial: trialPhase(trial, at),
  };
}

/** Non-React check (stores, actions). */
export function isProNow(now = Date.now()): boolean {
  const s = useTrialStore.getState();
  return hasProAccess(s, now, useEntitlementStore.getState().entitlement.isActive);
}
