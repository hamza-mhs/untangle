import { z } from 'zod';

import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

/**
 * The last Clarity shown while blocking worked. When access is revoked, Clarity *freezes* at
 * this value instead of dropping (EDGE_CASES › Permissions).
 */
type ClarityStore = {
  lastLive: number | null;
  /** First Clarity seen today (FFocusDone "+6 today"). */
  dayStart: { day: string; value: number } | null;
  setLastLive: (v: number, day: string) => void;
};

export const useClarityStore = createPersistedStore<ClarityStore>(
  STORE_KEYS.clarity,
  (set, get) => ({
    lastLive: null,
    dayStart: null,
    setLastLive: (lastLive, day) =>
      set({
        lastLive,
        dayStart: get().dayStart?.day === day ? get().dayStart : { day, value: lastLive },
      }),
  }),
  {
    schema: z
      .object({
        lastLive: z.number().nullable(),
        dayStart: z.object({ day: z.string(), value: z.number() }).nullable(),
      })
      .partial(),
  },
);
