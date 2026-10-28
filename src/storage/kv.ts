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

/** Persisted store keys, also used by backup export/import. */
export const STORE_KEYS = {
  settings: 'store.settings',
  rules: 'store.rules',
  focus: 'store.focus',
  challenges: 'store.challenges',
  scoring: 'store.scoring',
  trial: 'store.trial',
  onboarding: 'store.onboarding',
  entitlement: 'store.entitlement',
  paywall: 'store.paywall',
  clarity: 'store.clarity',
  reps: 'store.reps',
  rewards: 'store.rewards',
  lock: 'store.lock',
} as const;
