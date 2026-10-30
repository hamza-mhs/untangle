import { z } from 'zod';

import { isProNow } from '@/features/paywall';
import { blocker } from '@/native';
import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

import { pausedByPlan } from './allowance';
import { targetKey, type Lock, type LockTarget, type Strictness } from './types';

/** Free tier: up to three locks (20-phase2-core-app §6.1). */
export const FREE_LOCK_LIMIT = 3;
/** Default allowance for locks made in onboarding (10-phase1-onboarding §2.18). */
export const DEFAULT_DAILY_MINUTES = 30;

/** RFC 4122 v4 id. Lock ids only need to be unique on this phone. */
export function newId(rand: () => number = Math.random): string {
  const hex = Array.from({ length: 32 }, () => Math.floor(rand() * 16));
  hex[12] = 4;
  hex[16] = ((hex[16] ?? 0) & 0x3) | 0x8;
  const h = hex.map((n) => n.toString(16)).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export type Allowance = { dailyMinutes: number | null; dailyOpens: number | null };

export function makeLock(
  target: LockTarget,
  allowance: Allowance,
  strictness: Strictness,
  now = Date.now(),
): Lock {
  return { id: newId(), target, ...allowance, strictness, enabled: true, createdAt: now };
}

type LocksState = {
  locks: Lock[];
  /** Free plan: the lock ids the user chose to keep on (20-phase2 §10). */
  freeKeep: string[];
  setFreeKeep: (ids: string[]) => void;
  /** Adds locks, skipping targets that already have one. Returns the ones added. */
  addLocks: (targets: LockTarget[], allowance: Allowance, strictness: Strictness) => Lock[];
  updateLock: (id: string, patch: Partial<Omit<Lock, 'id' | 'target' | 'createdAt'>>) => void;
  removeLock: (id: string) => void;
  reset: () => void;
};

const targetSchema = z.union([
  z.object({ kind: z.literal('app'), packageName: z.string(), label: z.string() }),
  z.object({ kind: z.literal('site'), domain: z.string() }),
]);
const schema = z
  .object({
    locks: z.array(
      z.object({
        id: z.string(),
        target: targetSchema,
        dailyMinutes: z.number().nullable(),
        dailyOpens: z.number().nullable(),
        strictness: z.enum(['gentle', 'firm', 'locked']),
        enabled: z.boolean(),
        createdAt: z.number(),
      }),
    ),
    freeKeep: z.array(z.string()),
  })
  .partial();

/**
 * Hands the full set to the native side, which enforces it (02-android-platform §5). Locks
 * paused by the free plan go across switched off.
 */
export function pushLocksToNative(locks: Lock[]) {
  const paused = pausedByPlan(locks, isProNow(), useLocksStore.getState().freeKeep);
  const effective = locks.map((l) => (paused.has(l.id) ? { ...l, enabled: false } : l));
  blocker.setLocks(effective).catch(() => {
    // The service re-reads on its next start; the JS copy stays the edit source.
  });
}

/**
 * JS copy of the locks, persisted to MMKV for the UI. Every change is written through to the
 * native module, which is the source of truth for enforcement.
 */
export const useLocksStore = createPersistedStore<LocksState>(
  STORE_KEYS.locks,
  (set, get) => {
    const commit = (locks: Lock[]) => {
      set({ locks });
      pushLocksToNative(locks);
    };
    return {
      locks: [],
      freeKeep: [],
      setFreeKeep: (ids) => {
        set({ freeKeep: ids });
        pushLocksToNative(get().locks);
      },
      addLocks: (targets, allowance, strictness) => {
        const have = new Set(get().locks.map((l) => targetKey(l.target)));
        const added = targets
          .filter((t) => !have.has(targetKey(t)))
          .map((t) => makeLock(t, allowance, strictness));
        if (added.length) commit([...get().locks, ...added]);
        return added;
      },
      updateLock: (id, patch) =>
        commit(get().locks.map((l) => (l.id === id ? { ...l, ...patch } : l))),
      removeLock: (id) => commit(get().locks.filter((l) => l.id !== id)),
      reset: () => commit([]),
    };
  },
  { schema },
);
