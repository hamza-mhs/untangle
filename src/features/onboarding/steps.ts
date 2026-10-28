import type { Href } from 'expo-router';

/**
 * The onboarding flow, in order (SPEC §5). Step N lives at src/app/(onboarding)/<slug>.tsx;
 * `index` is the splash at "/".
 */
export const onboardingSteps = [
  'index',
  'screen-time',
  'apps',
  'when',
  'goals',
  'your-year',
  'good-news',
  'strength',
  'screen-time-access',
  'pick-apps',
  'notifications',
  'quiet-minute',
  'knot-loosened',
  'plan',
  'trial',
] as const;

export const ONBOARDING_TOTAL = onboardingSteps.length;

export type OnboardingSlug = (typeof onboardingSteps)[number];

/** From step 13 on there's no swipe-back: the quiet minute is done (SPEC §4). */
export const FIRST_NO_GESTURE_STEP = 13;

/** 1-based step number of a slug. */
export function stepOf(slug: OnboardingSlug): number {
  return onboardingSteps.indexOf(slug) + 1;
}

export function hrefForStep(step: number): Href {
  const slug = onboardingSteps[step - 1] ?? 'index';
  return (slug === 'index' ? '/' : `/${slug}`) as Href;
}

export function nextStep(slug: OnboardingSlug): OnboardingSlug | null {
  return onboardingSteps[stepOf(slug)] ?? null;
}
