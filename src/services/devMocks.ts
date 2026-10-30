import { z } from 'zod';

import { createPersistedStore } from '@/storage/createStore';

/**
 * Dev-only switches for the mock native module and the mock store (emulator, tests). They let
 * you walk every failure path without a real phone or a Play account. Ignored in release builds.
 */

/** What happens when the user is sent to a settings screen and comes back. */
export const MOCK_GRANTS = ['grant', 'deny', 'restricted'] as const;
export type MockGrant = (typeof MOCK_GRANTS)[number];

/** Paywall offerings: loaded, stuck loading, or offline. */
export const MOCK_OFFERINGS = ['ready', 'loading', 'offline'] as const;
export type MockOfferings = (typeof MOCK_OFFERINGS)[number];
export const MOCK_PURCHASES = ['success', 'cancelled', 'failed', 'pending', 'unavailable'] as const;
export type MockPurchase = (typeof MOCK_PURCHASES)[number];
export type MockRestore = 'found' | 'none';
/** Store subscription state. */
export const MOCK_BILLING = ['free', 'active', 'grace', 'lifetime', 'family'] as const;
export type MockBilling = (typeof MOCK_BILLING)[number];

/** Installed-app fixture for the mock module. */
export const MOCK_APP_SETS = ['usual', 'noSuspects', 'loading'] as const;
export type MockAppSet = (typeof MOCK_APP_SETS)[number];

type DevMocksState = {
  accessibility: MockGrant;
  usageAccess: Exclude<MockGrant, 'restricted'>;
  battery: Exclude<MockGrant, 'restricted'>;
  apps: MockAppSet;
  offerings: MockOfferings;
  purchase: MockPurchase;
  restore: MockRestore;
  billing: MockBilling;
  /** Dev menu: treat the user as Pro whatever the store says. */
  forcePro: boolean;
  /** Use the mock native module even when the real one is in the build. */
  forceNativeMock: boolean;
  set: (patch: Partial<Omit<DevMocksState, 'set'>>) => void;
};

const schema = z
  .object({
    accessibility: z.enum(MOCK_GRANTS),
    usageAccess: z.enum(['grant', 'deny']),
    battery: z.enum(['grant', 'deny']),
    apps: z.enum(MOCK_APP_SETS),
    offerings: z.enum(MOCK_OFFERINGS),
    purchase: z.enum(MOCK_PURCHASES),
    restore: z.enum(['found', 'none']),
    billing: z.enum(MOCK_BILLING),
    forcePro: z.boolean(),
    forceNativeMock: z.boolean(),
  })
  .partial();

export const useDevMocksStore = createPersistedStore<DevMocksState>(
  'dev.mocks',
  (set) => ({
    accessibility: 'grant',
    usageAccess: 'grant',
    battery: 'grant',
    apps: 'usual',
    offerings: 'ready',
    purchase: 'success',
    restore: 'found',
    billing: 'free',
    forcePro: false,
    forceNativeMock: false,
    set: (patch) => set(patch),
  }),
  { version: 2, schema },
);
