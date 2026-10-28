import { z } from 'zod';

import { dayKey } from '@/lib/time';
import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

import { REP_IDS, type RepId } from './catalog';
import { nextLevel, type RoundRecord } from './rules';

/**
 * Daily rounds per rep (pack 2 SPEC §3): one counted round a day, one retry after a time-up,
 * best times, and the difficulty ladder (up after a win, down after two losses in a row).
 */
type RepsStore = {
  day: string;
  /** Today's rounds per game. */
  today: Partial<Record<RepId, RoundRecord>>;
  bestMs: Partial<Record<RepId, number>>;
  level: Partial<Record<RepId, number>>;
  lossStreak: Partial<Record<RepId, number>>;
  /** Number span: longest sequence typed back. */
  bestSpan: number;
  roundFor: (id: RepId, now?: number) => RoundRecord | null;
  start: (id: RepId, now?: number) => void;
  finish: (id: RepId, result: { won: boolean; elapsedMs: number }, now?: number) => void;
  setBestSpan: (n: number) => void;
};

const recordSchema = z.object({
  attempts: z.number(),
  won: z.boolean(),
  elapsedMs: z.number().nullable(),
});

const schema = z
  .object({
    day: z.string(),
    today: z.record(z.string(), recordSchema),
    bestMs: z.record(z.string(), z.number()),
    level: z.record(z.string(), z.number()),
    lossStreak: z.record(z.string(), z.number()),
    bestSpan: z.number(),
  })
  .partial();

export const useRepsStore = createPersistedStore<RepsStore>(
  STORE_KEYS.reps,
  (set, get) => {
    /** The day rolls over: yesterday's rounds no longer count. */
    const roll = (now: number) => {
      const day = dayKey(now);
      if (get().day !== day) set({ day, today: {} });
    };
    return {
      day: '',
      today: {},
      bestMs: {},
      level: {},
      lossStreak: {},
      bestSpan: 0,
      roundFor: (id, now = Date.now()) => {
        roll(now);
        return get().today[id] ?? null;
      },
      start: (id, now = Date.now()) => {
        roll(now);
        const prev = get().today[id];
        set({
          today: {
            ...get().today,
            [id]: { attempts: (prev?.attempts ?? 0) + 1, won: false, elapsedMs: null },
          },
        });
      },
      finish: (id, { won, elapsedMs }, now = Date.now()) => {
        roll(now);
        const prev = get().today[id] ?? { attempts: 1, won: false, elapsedMs: null };
        const losses = won ? 0 : (get().lossStreak[id] ?? 0) + 1;
        const best = get().bestMs[id];
        set({
          today: { ...get().today, [id]: { ...prev, won, elapsedMs } },
          lossStreak: { ...get().lossStreak, [id]: losses >= 2 ? 0 : losses },
          level: { ...get().level, [id]: nextLevel(get().level[id] ?? 1, won, losses) },
          bestMs:
            won && (best === undefined || elapsedMs < best)
              ? { ...get().bestMs, [id]: elapsedMs }
              : get().bestMs,
        });
      },
      setBestSpan: (n) => set({ bestSpan: Math.max(get().bestSpan, n) }),
    };
  },
  { schema },
);

export function playedToday(today: Partial<Record<RepId, RoundRecord>>): RepId[] {
  return REP_IDS.filter((id) => today[id]?.won);
}

/** Today's round for a game without rolling the day over (safe to call while rendering). */
export function peekRound(id: RepId, now = Date.now()): RoundRecord | null {
  const s = useRepsStore.getState();
  return s.day === dayKey(now) ? (s.today[id] ?? null) : null;
}
