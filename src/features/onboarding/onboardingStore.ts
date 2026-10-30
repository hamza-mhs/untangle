import { z } from 'zod';

import { createPersistedStore } from '@/storage/createStore';
import { STORE_KEYS } from '@/storage/kv';

import { ONBOARDING_STEPS, type OnboardingStep } from './steps';

/** onboarding.answers (10-phase1-onboarding §3). Ids, never display strings. */
export type OnboardingAnswers = {
  /** Midpoint age of the chosen band (16, 21, 29, 39, 49, 60). */
  ageMid: number | null;
  /** Hours used for the maths (0.5 … 4.5, "Not sure" = 2.65). */
  scrollHours: number | null;
  scrollAnswer: string | null;
  pickupsAnswer: string | null;
  /** Focus-sign ids; empty when "None of these" was picked. */
  signs: string[];
  signsNone: boolean;
};

const EMPTY_ANSWERS: OnboardingAnswers = {
  ageMid: null,
  scrollHours: null,
  scrollAnswer: null,
  pickupsAnswer: null,
  signs: [],
  signsNone: false,
};

type OnboardingState = {
  answers: OnboardingAnswers;
  /** onboarding.step: the screen to resume on. */
  step: OnboardingStep;
  /** onboarding.completedAt: set when "You're all set" is shown; root redirects to tabs. */
  completedAt: number | null;
  setAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  setStep: (step: OnboardingStep) => void;
  complete: (at?: number) => void;
  reset: () => void;
};

const schema = z
  .object({
    answers: z.object({
      ageMid: z.number().nullable(),
      scrollHours: z.number().nullable(),
      scrollAnswer: z.string().nullable(),
      pickupsAnswer: z.string().nullable(),
      signs: z.array(z.string()),
      signsNone: z.boolean(),
    }),
    step: z.enum(ONBOARDING_STEPS),
    completedAt: z.number().nullable(),
  })
  .partial();

export const useOnboardingStore = createPersistedStore<OnboardingState>(
  STORE_KEYS.onboarding,
  (set, get) => ({
    answers: EMPTY_ANSWERS,
    step: 'index',
    completedAt: null,
    setAnswer: (key, value) => set({ answers: { ...get().answers, [key]: value } }),
    setStep: (step) => set({ step }),
    complete: (at = Date.now()) => set({ completedAt: at }),
    reset: () => set({ answers: EMPTY_ANSWERS, step: 'index', completedAt: null }),
  }),
  { schema },
);
