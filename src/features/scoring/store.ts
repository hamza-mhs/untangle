import { dayKey, type DayKey } from '@/lib/time';
import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';
import {
  insertLedgerRow,
  ledgerTotals,
  type LedgerKind,
  type LedgerVerification,
} from '@/storage/ledgerRepo';

import type { ChallengeDef } from '../challenges/library';
import { freezesAfter } from '../challenges/rules';
import { clarityScore } from './clarity';
import { challengeReward, type LedgerEntry } from './points';
import { computeStreak, settleMissedDays } from './streak';

/**
 * Scoring. The SQLite `ledger` table is the source of truth: every earn and spend is a row
 * (storage/ledgerRepo). `points` / `minutes` here are a cache of those sums for synchronous
 * reads, rebuilt from SQLite on launch (`hydrate`), never authoritative.
 */
type ScoringStore = {
  points: number;
  minutes: number;
  completedByDay: Record<DayKey, number>;
  frozenDays: DayKey[];
  freezes: number;
  firstDay: DayKey | null;
  lastSettled: DayKey | null;
  wordPoints: { day: DayKey; points: number };

  /** Launch: rebuild the cached totals from the ledger. */
  hydrate: () => void;
  recordChallenge: (c: ChallengeDef, now?: number) => LedgerEntry;
  /** +50 for all three, +100 boss, a won rep… */
  recordEarn: (
    kind: LedgerKind,
    points: number,
    minutes: number,
    ref: string,
    verification: LedgerVerification | null,
    now?: number,
  ) => LedgerEntry;
  /** A finished focus session (points and earned app time). */
  recordFocus: (points: number, minutes: number, now?: number) => LedgerEntry;
  spendMinutes: (minutes: number, now?: number) => LedgerEntry | null;
  /** A redemption already written to SQLite: just move the cache. */
  applyRedeem: (cost: number) => void;
  earnFreeze: (count?: number) => void;
  /** Run on app open: spend freezes on missed days since last open. */
  settle: (now?: number) => void;
  streak: (now?: number) => number;
  clarity: (now?: number) => number;
};

export const useScoringStore = createPersistedStore<ScoringStore>(
  STORE_KEYS.scoring,
  (set, get) => {
    const write = (entry: LedgerEntry) => {
      insertLedgerRow(entry);
      const s = get();
      set({
        points: s.points + entry.points,
        minutes: s.minutes + entry.minutes,
        firstDay: s.firstDay ?? entry.day,
      });
      return entry;
    };
    return {
      points: 0,
      minutes: 0,
      completedByDay: {},
      frozenDays: [],
      freezes: 0,
      firstDay: null,
      lastSettled: null,
      wordPoints: { day: '', points: 0 },

      hydrate: () => {
        const totals = ledgerTotals();
        if (totals.points !== 0 || totals.minutes !== 0) {
          set({ points: totals.points, minutes: totals.minutes });
        }
      },

      recordChallenge: (c, now = Date.now()) => {
        const day = dayKey(now);
        const s = get();
        const wordSoFar = s.wordPoints.day === day ? s.wordPoints.points : 0;
        const reward = challengeReward(c, wordSoFar);
        set({
          completedByDay: { ...s.completedByDay, [day]: (s.completedByDay[day] ?? 0) + 1 },
          wordPoints:
            c.verification === 'word' ? { day, points: wordSoFar + reward.points } : s.wordPoints,
        });
        // Hard challenges earn a streak freeze (pack 2 SPEC §3).
        if (c.difficulty === 'hard') get().earnFreeze();
        return write({
          at: now,
          day,
          kind: 'challenge',
          points: reward.points,
          minutes: reward.minutes,
          verification: c.verification,
          ref: c.id,
        });
      },

      recordEarn: (kind, points, minutes, ref, verification, now = Date.now()) =>
        write({ at: now, day: dayKey(now), kind, points, minutes, verification, ref }),

      recordFocus: (points, minutes, now = Date.now()) =>
        write({
          at: now,
          day: dayKey(now),
          kind: 'focus',
          points,
          minutes,
          verification: 'timed',
          ref: 'focus',
        }),

      spendMinutes: (minutes, now = Date.now()) => {
        if (minutes <= 0 || minutes > get().minutes) return null;
        return write({ at: now, day: dayKey(now), kind: 'spend', points: 0, minutes: -minutes });
      },

      applyRedeem: (cost) => set({ points: get().points - cost }),

      earnFreeze: (count = 1) =>
        set({ freezes: freezesAfter(get().freezes, { hard: count, boss: 0 }) }),

      settle: (now = Date.now()) => {
        const today = dayKey(now);
        const s = get();
        if (s.lastSettled === null) {
          set({ lastSettled: today });
          return;
        }
        const { frozen, freezesLeft } = settleMissedDays({
          lastSettled: s.lastSettled,
          today,
          completedByDay: s.completedByDay,
          freezes: s.freezes,
        });
        set({ frozenDays: [...s.frozenDays, ...frozen], freezes: freezesLeft, lastSettled: today });
      },

      streak: (now = Date.now()) =>
        computeStreak({
          completedByDay: get().completedByDay,
          frozenDays: new Set(get().frozenDays),
          today: dayKey(now),
        }),

      clarity: (now = Date.now()) => {
        const { completedByDay, firstDay } = get();
        return firstDay ? clarityScore({ completedByDay, today: dayKey(now), firstDay }) : 0;
      },
    };
  },
);
