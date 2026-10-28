import { z } from 'zod';

import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

import {
  APP_LABELS,
  GOAL_IDS,
  SCREEN_TIME_BUCKETS,
  WHEN_TRIGGERS,
  type OnboardingAnswers,
} from './types';

/**
 * Onboarding answers + progress. Persisted to MMKV after every change, so killing the app
 * mid-flow resumes at the last unfinished step.
 */
type OnboardingState = OnboardingAnswers & {
  /** Furthest step reached (1-based). */
  lastStep: number;
  /** E02: show the "Notifications are off" sheet once, on the first Home open. */
  isNotificationsSheetPending: boolean;
};

type OnboardingActions = {
  setAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  reachStep: (step: number) => void;
  /** OB11 denied: E02 shows on the first Home open. */
  queueNotificationsSheet: () => void;
  markNotificationsSheetShown: () => void;
  reset: () => void;
};

const initialState: OnboardingState = {
  screenTime: null,
  apps: [],
  when: [],
  goals: [],
  strength: 'earn',
  blocking: 'unknown',
  appSelection: null,
  notifications: 'unknown',
  startingClarity: null,
  lastStep: 1,
  isNotificationsSheetPending: false,
};

const appSelectionSchema = z.union([
  z.object({ platform: z.literal('ios'), token: z.string(), count: z.number() }),
  z.object({ platform: z.literal('android'), packages: z.array(z.string()) }),
]);

/** What may come back from MMKV. Unknown or malformed data falls back to the defaults. */
const persistedSchema = z
  .object({
    screenTime: z.enum(SCREEN_TIME_BUCKETS).nullable(),
    apps: z.array(z.enum(APP_LABELS)),
    when: z.array(z.enum(WHEN_TRIGGERS)),
    goals: z.array(z.enum(GOAL_IDS)).max(2),
    strength: z.enum(['pause', 'earn', 'locked']),
    blocking: z.enum(['unknown', 'approved', 'denied', 'skipped']),
    appSelection: appSelectionSchema.nullable(),
    notifications: z.enum(['unknown', 'granted', 'denied']),
    startingClarity: z.number().int().min(0).max(100).nullable(),
    lastStep: z.number().int().min(1),
    isNotificationsSheetPending: z.boolean(),
  })
  .partial();

export const useOnboardingStore = createPersistedStore<OnboardingState & OnboardingActions>(
  STORE_KEYS.onboarding,
  (set, get) => ({
    ...initialState,
    setAnswer: (key, value) => set({ [key]: value } as Partial<OnboardingState>),
    reachStep: (step) => {
      if (step > get().lastStep) set({ lastStep: step });
    },
    queueNotificationsSheet: () => set({ isNotificationsSheetPending: true }),
    markNotificationsSheetShown: () => set({ isNotificationsSheetPending: false }),
    reset: () => set({ ...initialState }),
  }),
  { version: 2, schema: persistedSchema },
);
