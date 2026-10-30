import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * Key-value storage (MMKV v4, synchronous). Holds settings and every persisted zustand store.
 * History (days, sessions, ledger, rep results) lives in SQLite — see storage/db.
 * Under Jest, react-native-mmkv returns an in-memory mock automatically.
 */
export const kv = createMMKV({ id: 'untangle' });

/** zustand `persist` adapter. */
export const kvStateStorage: StateStorage = {
  getItem: (name) => kv.getString(name) ?? null,
  setItem: (name, value) => kv.set(name, value),
  removeItem: (name) => {
    kv.remove(name);
  },
};

/** Persisted store keys (one zustand store per feature, persisted to MMKV). */
export const STORE_KEYS = {
  onboarding: 'onboarding',
  settings: 'settings',
  streak: 'streak',
  training: 'training',
  paywall: 'paywall',
  entitlement: 'entitlement',
  focus: 'focus',
  locks: 'locks',
  dev: 'dev',
} as const;
