import { z } from 'zod';

import { addDays, dayKey, type DayKey } from '@/lib/time';
import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

import { isGameId, type GameId } from './catalog';
import { lastPlayedDays } from './results';
import { pickTraining } from './training';

/** MMKV `training.day`: today's three, kept so the pick is stable all day. */
type TrainingState = {
  day: DayKey | null;
  ids: GameId[];
  /** The previous day's pick, to avoid repeating it. */
  previous: { day: DayKey; ids: GameId[] } | null;
  /** Today's pick, making it if the day changed. */
  today: (now?: number) => GameId[];
};

const schema = z
  .object({
    day: z.string().nullable(),
    ids: z.array(z.string()),
    previous: z.object({ day: z.string(), ids: z.array(z.string()) }).nullable(),
  })
  .partial();

export const useTrainingStore = createPersistedStore<TrainingState>(
  STORE_KEYS.training,
  (set, get) => ({
    day: null,
    ids: [],
    previous: null,
    today: (now = Date.now()) => {
      const day = dayKey(now);
      const s = get();
      if (s.day === day && s.ids.length) return s.ids.filter(isGameId);
      const prev = s.day && s.ids.length ? { day: s.day, ids: s.ids } : s.previous;
      const yesterday = prev && prev.day === addDays(day, -1) ? prev.ids : null;
      let lastPlayed: Record<string, DayKey> = {};
      try {
        lastPlayed = lastPlayedDays();
      } catch {
        // Database not ready yet (first frame): pick without history.
      }
      const ids = pickTraining({ day, lastPlayed, yesterday });
      set({ day, ids, previous: prev });
      return ids;
    },
  }),
  { schema },
);
