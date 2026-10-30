import { z } from 'zod';

import { dayKey, type DayKey } from '@/lib/time';
import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

import { latestBatch } from './catalog';

/** MMKV `newGames`: the day this install first saw each batch, for the 14-day "New" tag. */
type NewGamesState = {
  seen: Record<string, DayKey>;
  /** Records today for the latest batch if it's the first time; returns its first-seen day. */
  markLatest: (now?: number) => DayKey;
};

const schema = z.object({ seen: z.record(z.string(), z.string()) }).partial();

export const useNewGamesStore = createPersistedStore<NewGamesState>(
  STORE_KEYS.newGames,
  (set, get) => ({
    seen: {},
    markLatest: (now = Date.now()) => {
      const batch = latestBatch();
      const have = get().seen[batch];
      if (have) return have;
      const day = dayKey(now);
      set({ seen: { ...get().seen, [batch]: day } });
      return day;
    },
  }),
  { schema },
);
