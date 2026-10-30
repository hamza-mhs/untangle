import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { blocker } from '@/native';
import { db } from '@/storage/db/client';
import { focusSessions } from '@/storage/db/schema';
import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

/** Focus now (20-phase2-core-app §7). */
export const FOCUS_DURATIONS = [15, 25, 45, 60] as const;
export const DEFAULT_FOCUS_MINUTES = 25;

export type FocusSession = {
  /** focus_sessions row id (null when the database wasn't available). */
  rowId: number | null;
  startedAt: number;
  endAt: number;
  plannedMs: number;
  targetKeys: string[];
};

export type FocusSummary = { minutes: number; endedEarly: boolean; detours: number };

/** Whole minutes left, rounded up; 0 when over. */
export function minutesLeft(s: Pick<FocusSession, 'endAt'>, now = Date.now()): number {
  return Math.max(0, Math.ceil((s.endAt - now) / 60_000));
}

/** "24:22" for the running countdown. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function isActive(s: FocusSession | null, now = Date.now()): boolean {
  return !!s && s.endAt > now;
}

type FocusState = {
  session: FocusSession | null;
  /** The finished session, for the completion screen. */
  finished: FocusSummary | null;
  start: (
    minutes: number,
    targetKeys: string[],
    now?: number,
  ) => Promise<'started' | 'alreadyRunning'>;
  end: (early: boolean, detours: number, now?: number) => Promise<void>;
  clearFinished: () => void;
};

const schema = z
  .object({
    session: z
      .object({
        rowId: z.number().nullable(),
        startedAt: z.number(),
        endAt: z.number(),
        plannedMs: z.number(),
        targetKeys: z.array(z.string()),
      })
      .nullable(),
  })
  .partial();

/**
 * One session at a time. The native side ends blocking at `endAt` by itself, even if the app is
 * killed or the phone restarts; this store only drives the UI and the history row.
 */
export const useFocusStore = createPersistedStore<FocusState>(
  STORE_KEYS.focus,
  (set, get) => ({
    session: null,
    finished: null,
    start: async (minutes, targetKeys, now = Date.now()) => {
      if (isActive(get().session, now)) return 'alreadyRunning';
      const plannedMs = minutes * 60_000;
      const endAt = now + plannedMs;
      let rowId: number | null = null;
      try {
        const row = db
          .insert(focusSessions)
          .values({ startedAt: now, plannedMs })
          .returning({ id: focusSessions.id })
          .get();
        rowId = row?.id ?? null;
      } catch {
        // History is optional; blocking is not.
      }
      await blocker.startFocusSession(endAt, targetKeys as `app:${string}`[]);
      set({ session: { rowId, startedAt: now, endAt, plannedMs, targetKeys }, finished: null });
      return 'started';
    },
    end: async (early, detours, now = Date.now()) => {
      const s = get().session;
      if (!s) return;
      if (early) await blocker.endFocusSession().catch(() => {});
      const endedAt = early ? now : Math.min(now, s.endAt);
      try {
        if (s.rowId !== null) {
          db.update(focusSessions)
            .set({ endedAt, endedEarly: early })
            .where(eq(focusSessions.id, s.rowId))
            .run();
        }
      } catch {
        // Keep going.
      }
      set({
        session: null,
        finished: {
          minutes: Math.round((endedAt - s.startedAt) / 60_000),
          endedEarly: early,
          detours,
        },
      });
    },
    clearFinished: () => set({ finished: null }),
  }),
  { schema, partialize: (s) => ({ session: s.session }) },
);
