import { z } from 'zod';

import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { dayKey, isoWeekKey } from '@/lib/time';
import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

import { useScoringStore } from '../scoring/store';
import { challengeById, type Verification } from './library';
import {
  ALL_THREE_BONUS,
  bonusFor,
  BOSS_POINTS,
  drawForDay,
  flip,
  markDone,
  redraw,
  type DailyDraw,
} from './rules';

type ChallengesStore = {
  draw: DailyDraw | null;
  /** Library chips done this week ({id, week}). */
  libraryDone: { id: string; week: string }[];
  /** The boss done this week (week key), if any. */
  bossDoneWeek: string | null;
  /** Today's draw, created fresh when the day changes (unfinished cards just expire). */
  ensureToday: (now?: number) => DailyDraw;
  flipCard: (slot: 0 | 1 | 2, now?: number) => void;
  flipAll: (now?: number) => void;
  redraw: (slot: 0 | 1 | 2) => void;
  /**
   * Marks a card done and credits points (+ the all-three bonus). `verification` overrides the
   * card's check, e.g. a verified card falls back to "your word" without Health access.
   * Returns the points credited, or null if it wasn't valid.
   */
  complete: (id: string, now?: number, verification?: Verification) => number | null;
  completeLibrary: (id: string, now?: number) => number | null;
  completeBoss: (now?: number) => number | null;
};

const goals = () => useOnboardingStore.getState().goals;

const drawSchema = z.object({
  day: z.string(),
  cards: z.tuple([z.string(), z.string(), z.string()]),
  flipped: z.tuple([z.boolean(), z.boolean(), z.boolean()]),
  redrawsLeft: z.number(),
  done: z.array(z.string()),
  drawnAt: z.number().nullable(),
});

const schema = z
  .object({
    draw: drawSchema.nullable(),
    libraryDone: z.array(z.object({ id: z.string(), week: z.string() })),
    bossDoneWeek: z.string().nullable(),
  })
  .partial();

export const useChallengesStore = createPersistedStore<ChallengesStore>(
  STORE_KEYS.challenges,
  (set, get) => ({
    draw: null,
    libraryDone: [],
    bossDoneWeek: null,
    ensureToday: (now = Date.now()) => {
      const today = dayKey(now);
      const current = get().draw;
      if (current?.day === today) return current;
      const fresh = drawForDay(today, goals());
      set({ draw: fresh });
      return fresh;
    },
    flipCard: (slot, now = Date.now()) => {
      const d = get().ensureToday(now);
      set({ draw: flip(d, slot, now) });
    },
    flipAll: (now = Date.now()) => {
      let d = get().ensureToday(now);
      for (const slot of [0, 1, 2] as const) d = flip(d, slot, now);
      set({ draw: d });
    },
    redraw: (slot) => {
      const d = get().draw;
      if (d) set({ draw: redraw(d, slot, goals()) });
    },
    complete: (id, now = Date.now(), verification) => {
      const d = get().ensureToday(now);
      const def = challengeById(id);
      const next = markDone(d, id);
      if (!def || next === d) return null;
      set({ draw: next });
      const scoring = useScoringStore.getState();
      const entry = scoring.recordChallenge(verification ? { ...def, verification } : def, now);
      let credited = entry.points;
      if (bonusFor(next) > 0) {
        scoring.recordEarn('bonus', ALL_THREE_BONUS, 0, `bonus:${next.day}`, 'verified', now);
        credited += ALL_THREE_BONUS;
      }
      return credited;
    },
    completeLibrary: (id, now = Date.now()) => {
      const week = isoWeekKey(now);
      const def = challengeById(id);
      if (!def || get().libraryDone.some((l) => l.id === id && l.week === week)) return null;
      set({ libraryDone: [...get().libraryDone.filter((l) => l.week === week), { id, week }] });
      return useScoringStore.getState().recordChallenge(def, now).points;
    },
    completeBoss: (now = Date.now()) => {
      const week = isoWeekKey(now);
      if (get().bossDoneWeek === week) return null;
      set({ bossDoneWeek: week });
      const scoring = useScoringStore.getState();
      scoring.recordEarn('boss', BOSS_POINTS, 0, `boss:${week}`, 'timed', now);
      scoring.earnFreeze();
      return BOSS_POINTS;
    },
  }),
  { version: 2, schema },
);
