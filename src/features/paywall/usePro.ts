import { useDevMocksStore } from '@/services/devMocks';
import { useEntitlementStore } from '@/services/purchases';

/**
 * Pro = the RevenueCat `pro` entitlement (the 3-day trial is Google Play's, so a trialling user
 * already has it). The cached entitlement keeps Pro working offline after a restart. Dev builds
 * can force it on from the dev menu.
 */
export function usePro(): { isPro: boolean } {
  const isActive = useEntitlementStore((s) => s.entitlement.isActive);
  const forced = useDevMocksStore((s) => __DEV__ && s.forcePro);
  return { isPro: isActive || forced };
}

/** Non-React check (stores, actions). */
export function isProNow(): boolean {
  return (
    useEntitlementStore.getState().entitlement.isActive ||
    (__DEV__ && useDevMocksStore.getState().forcePro)
  );
}
