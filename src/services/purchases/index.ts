import { z } from 'zod';

import { err, ok, type Result } from '@/lib/result';
import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

import { useDevMocksStore } from '../devMocks';
import { useMocks } from '../nativeModules';
import type { PurchaseFailure } from './errors';
import { PurchasesService } from './PurchasesService';
import { NO_ENTITLEMENT, type Entitlement, type Offering, type Plan } from './types';

export * from './errors';
export * from './types';
export { sortPlans, toEntitlement } from './PurchasesService';

/** The surface the paywall uses. Real RevenueCat when keyed, otherwise the dev mock. */
export interface Purchases {
  readonly isMock: boolean;
  configure(): void;
  getOffering(): Promise<Result<Offering, 'offline' | 'error'>>;
  purchase(plan: Plan): Promise<Result<Entitlement, PurchaseFailure>>;
  restore(): Promise<Result<Entitlement, 'none' | 'offline' | 'failed'>>;
  getEntitlement(): Promise<Entitlement | null>;
  onChange(listener: (e: Entitlement) => void): () => void;
  openManageSubscriptions(): Promise<void>;
}

// ---------- entitlement store (cached, so Pro works offline after a restart) ----------

const entitlementSchema = z.object({
  isActive: z.boolean(),
  plan: z.enum(['yearly', 'monthly', 'lifetime']).nullable(),
  willRenew: z.boolean(),
  expiresAt: z.number().nullable(),
  isInGrace: z.boolean(),
  isFamilyShared: z.boolean(),
  endedAt: z.number().nullable(),
});

type EntitlementStore = {
  entitlement: Entitlement;
  set: (e: Entitlement) => void;
};

export const useEntitlementStore = createPersistedStore<EntitlementStore>(
  STORE_KEYS.entitlement,
  (set) => ({ entitlement: NO_ENTITLEMENT, set: (entitlement) => set({ entitlement }) }),
  { schema: z.object({ entitlement: entitlementSchema }).partial() },
);

// ---------- mock (simulators, tests, no key) ----------

const MOCK_DELAY_MS = 700;
const wait = (ms = MOCK_DELAY_MS) => new Promise((r) => setTimeout(r, ms));
const YEAR = 365 * 24 * 60 * 60 * 1000;
const MONTH = 30 * 24 * 60 * 60 * 1000;

/** Dev-menu billing state → entitlement (P09 variants, P11 grace). */
export function mockEntitlement(): Entitlement {
  const billing = useDevMocksStore.getState().billing;
  const now = Date.now();
  switch (billing) {
    case 'free':
      return NO_ENTITLEMENT;
    case 'active':
      return {
        ...NO_ENTITLEMENT,
        isActive: true,
        plan: 'yearly',
        willRenew: true,
        expiresAt: now + YEAR,
      };
    case 'grace':
      return {
        ...NO_ENTITLEMENT,
        isActive: true,
        plan: 'yearly',
        willRenew: true,
        expiresAt: now + MONTH,
        isInGrace: true,
      };
    case 'lifetime':
      return { ...NO_ENTITLEMENT, isActive: true, plan: 'lifetime' };
    case 'family':
      return {
        ...NO_ENTITLEMENT,
        isActive: true,
        plan: 'yearly',
        willRenew: true,
        expiresAt: now + YEAR,
        isFamilyShared: true,
      };
  }
}

/** Placeholder prices for the mock only (real ones always come from the store). */
const MOCK_OFFERING: Offering = {
  plans: [
    { id: 'yearly', priceString: '$29.99', pricePerMonthString: '$2.50', packageId: '$rc_annual' },
    { id: 'monthly', priceString: '$4.99', pricePerMonthString: null, packageId: '$rc_monthly' },
    { id: 'lifetime', priceString: '$59.99', pricePerMonthString: null, packageId: '$rc_lifetime' },
  ],
  winBack: { priceString: '$14.99' },
};

function createMockPurchases(): Purchases {
  const listeners = new Set<(e: Entitlement) => void>();
  const emit = (e: Entitlement) => listeners.forEach((l) => l(e));
  return {
    isMock: true,
    configure: () => {},
    getOffering: async () => {
      const mode = useDevMocksStore.getState().offerings;
      if (mode === 'loading') return new Promise(() => {});
      await wait();
      return mode === 'offline' ? err('offline') : ok(MOCK_OFFERING);
    },
    purchase: async (plan) => {
      await wait();
      const outcome = useDevMocksStore.getState().purchase;
      if (outcome !== 'success') return err(outcome);
      const e: Entitlement = {
        ...NO_ENTITLEMENT,
        isActive: true,
        plan: plan.id,
        willRenew: plan.id !== 'lifetime',
        expiresAt:
          plan.id === 'lifetime' ? null : Date.now() + (plan.id === 'yearly' ? YEAR : MONTH),
      };
      emit(e);
      return ok(e);
    },
    restore: async () => {
      await wait();
      if (useDevMocksStore.getState().restore === 'none') return err('none');
      const e: Entitlement = {
        ...NO_ENTITLEMENT,
        isActive: true,
        plan: 'yearly',
        willRenew: true,
        expiresAt: Date.now() + YEAR,
      };
      emit(e);
      return ok(e);
    },
    getEntitlement: async () => mockEntitlement(),
    onChange: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    openManageSubscriptions: async () => {},
  };
}

function createRealPurchases(service: PurchasesService): Purchases {
  return {
    isMock: false,
    configure: () => void service.configure(),
    getOffering: () => service.getOffering(),
    purchase: (plan) => service.purchase(plan),
    restore: () => service.restore(),
    getEntitlement: () => service.getEntitlement(),
    onChange: (l) => service.onChange(l),
    openManageSubscriptions: () => service.openManageSubscriptions(),
  };
}

const service = new PurchasesService();
const hasKey = !!(
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
);

export const purchases: Purchases =
  useMocks && !hasKey ? createMockPurchases() : createRealPurchases(service);

/** Launch: configure, load the entitlement once, and keep the store in sync. */
export function startEntitlementSync(): () => void {
  purchases.configure();
  void purchases.getEntitlement().then((e) => {
    if (e) useEntitlementStore.getState().set(e);
  });
  return purchases.onChange((e) => useEntitlementStore.getState().set(e));
}

/** Dev menu: apply a billing switch immediately. */
export function refreshMockEntitlement() {
  if (purchases.isMock) useEntitlementStore.getState().set(mockEntitlement());
}
