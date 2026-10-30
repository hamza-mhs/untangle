import type { Href } from 'expo-router';

/**
 * The onboarding flow, in order (10-phase1-onboarding §1). Each step is a route in
 * src/app/(onboarding)/; `index` (the welcome slides) lives at "/".
 */
export const ONBOARDING_STEPS = [
  'index',
  'age',
  'scroll-time',
  'pickups',
  'focus-signs',
  'studying',
  'your-year',
  'problem-focus',
  'problem-distracted',
  'problem-foggy',
  'hours-back',
  'moment-of-pause',
  'step-one',
  'focus-grow',
  'trial',
  'permissions',
  'accessibility',
  'pick-apps',
  'all-set',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** The progress bar's chapters: one segment each (You · Results · The fix · Plan · Set up). */
export const CHAPTERS = ['you', 'results', 'fix', 'plan', 'setUp'] as const;
export type Chapter = (typeof CHAPTERS)[number];

const CHAPTER_OF: Record<OnboardingStep, Chapter | null> = {
  index: null,
  age: 'you',
  'scroll-time': 'you',
  pickups: 'you',
  'focus-signs': 'you',
  studying: 'results',
  'your-year': 'results',
  'problem-focus': 'results',
  'problem-distracted': 'results',
  'problem-foggy': 'results',
  'hours-back': 'fix',
  'moment-of-pause': 'fix',
  'step-one': 'fix',
  'focus-grow': 'fix',
  trial: 'plan',
  permissions: 'setUp',
  accessibility: 'setUp',
  'pick-apps': 'setUp',
  'all-set': 'setUp',
};

export function chapterOf(step: OnboardingStep): Chapter | null {
  return CHAPTER_OF[step];
}

/** Segments filled for a step: every earlier chapter plus the current one. */
export function chaptersDone(step: OnboardingStep): number {
  const c = chapterOf(step);
  return c === null ? 0 : CHAPTERS.indexOf(c) + 1;
}

/** No back chevron on the welcome slides or while "Studying your answers" runs. */
export function hasBack(step: OnboardingStep): boolean {
  return step !== 'index' && step !== 'studying';
}

export function stepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

export function prevStep(step: OnboardingStep): OnboardingStep | null {
  const i = stepIndex(step);
  return i > 0 ? (ONBOARDING_STEPS[i - 1] ?? null) : null;
}

export function nextStep(step: OnboardingStep): OnboardingStep | null {
  return ONBOARDING_STEPS[stepIndex(step) + 1] ?? null;
}

/**
 * Resume after the app was killed: reopen on the saved screen. The accessibility disclosure is
 * a step inside Permissions, so it reopens on Permissions (the rows re-check what is granted).
 */
export function resumeStep(saved: OnboardingStep): OnboardingStep {
  return saved === 'accessibility' ? 'permissions' : saved;
}

export function hrefFor(step: OnboardingStep): Href {
  return (step === 'index' ? '/' : `/${step}`) as Href;
}
