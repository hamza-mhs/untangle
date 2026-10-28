import { z } from 'zod';

import { createPersistedStore } from '@/storage/createStore';

/**
 * Dev-only switches for the mock native services (simulators, emulators, Expo Go). They let
 * you walk the failure paths — E01 (Screen Time denied), the OB10 empty-picker warning, E02
 * (notifications off), OB12's no-sensor fallback, every Home state, every purchase outcome —
 * without a real device or a store account. Ignored in release builds.
 */
export type MockScreenTime = 'approve' | 'deny';
export type MockPicker = 'select' | 'cancel';
/** `system` = use the real OS prompt (works on emulators: no entitlement needed). */
export type MockNotifications = 'system' | 'allow' | 'deny';
/** `system` = real DeviceMotion; `none` = pretend there's no sensor (Hold fallback). */
export type MockSensor = 'system' | 'none';
/** `live` = derive Home from the stores; otherwise show that fixture. */
export const HOME_FIXTURES = [
  'live',
  'idle',
  'focus',
  'evening',
  'day1',
  'off',
  'grace',
  'trial',
] as const;
export type MockHome = (typeof HOME_FIXTURES)[number];
/** Paywall offerings: loaded, stuck loading (→ E04 after 8 s), or offline. */
export const MOCK_OFFERINGS = ['ready', 'loading', 'offline'] as const;
export type MockOfferings = (typeof MOCK_OFFERINGS)[number];
export const MOCK_PURCHASES = ['success', 'cancelled', 'failed', 'pending'] as const;
export type MockPurchase = (typeof MOCK_PURCHASES)[number];
export type MockRestore = 'found' | 'none';
/** Store subscription state for P09 / P11. */
export const MOCK_BILLING = ['free', 'active', 'grace', 'lifetime', 'family'] as const;
export type MockBilling = (typeof MOCK_BILLING)[number];

type DevMocksState = {
  screenTime: MockScreenTime;
  picker: MockPicker;
  notifications: MockNotifications;
  sensor: MockSensor;
  home: MockHome;
  offerings: MockOfferings;
  purchase: MockPurchase;
  restore: MockRestore;
  billing: MockBilling;
  /** Mock Screen Time status, remembered across launches like the real one. */
  authStatus: 'approved' | 'denied' | 'notDetermined';
  set: (patch: Partial<Omit<DevMocksState, 'set'>>) => void;
};

const schema = z
  .object({
    screenTime: z.enum(['approve', 'deny']),
    picker: z.enum(['select', 'cancel']),
    notifications: z.enum(['system', 'allow', 'deny']),
    sensor: z.enum(['system', 'none']),
    home: z.enum(HOME_FIXTURES),
    offerings: z.enum(MOCK_OFFERINGS),
    purchase: z.enum(MOCK_PURCHASES),
    restore: z.enum(['found', 'none']),
    billing: z.enum(MOCK_BILLING),
    authStatus: z.enum(['approved', 'denied', 'notDetermined']),
  })
  .partial();

export const useDevMocksStore = createPersistedStore<DevMocksState>(
  'dev.mocks',
  (set) => ({
    screenTime: 'approve',
    picker: 'select',
    notifications: 'system',
    sensor: 'system',
    home: 'live',
    offerings: 'ready',
    purchase: 'success',
    restore: 'found',
    billing: 'free',
    authStatus: 'notDetermined',
    set: (patch) => set(patch),
  }),
  { schema },
);
