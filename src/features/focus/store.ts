import { z } from 'zod';

import type { AppSelection } from '@/features/rules/model';
import { focusSurface } from '@/native/liveActivity';
import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

import { useScoringStore } from '../scoring/store';
import { challengeById } from '@/features/challenges/library';
import { useChallengesStore } from '@/features/challenges/store';
import { cancelFocusEnd, scheduleFocusEnd } from './focusNotifications';
import { earnedMinutesFor, focusReducer, type FocusEvent, type FocusState } from './machine';

/** A finished session, kept for stats ("Longest focus") and the ladder. */
export type FocusSession = {
  startedAt: number;
  endedAt: number;
  minutes: number;
  isTimerOnly: boolean;
};

type FocusStore = {
  session: FocusState;
  history: FocusSession[];
  /** Apps locked during focus ("+ 9 more · Edit"). Null = every app in the rules. */
  selection: AppSelection | null;
  setSelection: (s: AppSelection | null) => void;
  dispatch: (event: FocusEvent) => void;
};

const MAX_HISTORY = 120;

const sessionSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('idle') }),
  z.object({
    status: z.literal('running'),
    startedAt: z.number(),
    endsAt: z.number(),
    minutes: z.number(),
    lockedCount: z.number(),
    isTimerOnly: z.boolean(),
  }),
  z.object({
    status: z.literal('done'),
    startedAt: z.number(),
    endedAt: z.number(),
    minutes: z.number(),
    earnedMinutes: z.number(),
    points: z.number(),
    isTimerOnly: z.boolean(),
  }),
]);

const persistedSchema = z
  .object({
    session: sessionSchema,
    history: z.array(
      z.object({
        startedAt: z.number(),
        endedAt: z.number(),
        minutes: z.number(),
        isTimerOnly: z.boolean(),
      }),
    ),
    selection: z
      .union([
        z.object({ platform: z.literal('ios'), token: z.string(), count: z.number() }),
        z.object({ platform: z.literal('android'), packages: z.array(z.string()) }),
      ])
      .nullable(),
  })
  .partial();

/**
 * Persisted so a running session survives the app being killed. The lock itself lives in the
 * OS (DeviceActivity + ManagedSettings on iOS, the foreground service on Android); on relaunch,
 * `tick` with the current time rehydrates from `endsAt` and moves it to `done` if it ended.
 */
/** A locked session long enough ticks off today's "Lock in, N min" cards. */
function completeFocusChallenges(minutes: number, at: number) {
  const challenges = useChallengesStore.getState();
  const draw = challenges.draw;
  if (!draw) return;
  for (const id of draw.cards) {
    const def = challengeById(id);
    if (def?.kind === 'focus' && (def.target ?? 0) <= minutes && !draw.done.includes(id)) {
      challenges.complete(id, at);
    }
  }
}

export const useFocusStore = createPersistedStore<FocusStore>(
  STORE_KEYS.focus,
  (set, get) => ({
    session: { status: 'idle' },
    history: [],
    selection: null,
    setSelection: (selection) => set({ selection }),
    dispatch: (event) => {
      const prev = get().session;
      const next = focusReducer(prev, event);
      if (next === prev) return;
      set({ session: next });
      if (next.status === 'running' && prev.status !== 'running') {
        if (!next.isTimerOnly) focusSurface.start(next.endsAt, next.lockedCount);
        void scheduleFocusEnd(next.endsAt, next.isTimerOnly ? 0 : earnedMinutesFor(next.minutes));
      } else if (prev.status === 'running' && next.status === 'done') {
        if (!prev.isTimerOnly) focusSurface.end();
        void cancelFocusEnd();
        set({
          history: [
            ...get().history,
            {
              startedAt: next.startedAt,
              endedAt: next.endedAt,
              minutes: next.minutes,
              isTimerOnly: next.isTimerOnly,
            },
          ].slice(-MAX_HISTORY),
        });
        useScoringStore.getState().recordFocus(next.points, next.earnedMinutes, next.endedAt);
        if (!next.isTimerOnly) completeFocusChallenges(next.minutes, next.endedAt);
      }
    },
  }),
  { version: 2, schema: persistedSchema },
);

/** Longest locked session so far (the ladder ignores timer-only sessions). */
export function longestLocked(history: readonly FocusSession[]): number | null {
  const locked = history.filter((s) => !s.isTimerOnly);
  return locked.length ? Math.max(...locked.map((s) => s.minutes)) : null;
}
