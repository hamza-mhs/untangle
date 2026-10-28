import { router } from 'expo-router';

import { useSettingsStore } from '@/features/settings/store';

import { useOnboardingStore } from './onboardingStore';
import { hrefForStep } from './steps';

/**
 * Step the progress bar should animate *from* on the next screen: the step that was showing
 * last. Module state on purpose — it's UI continuity, not data.
 */
let lastShownStep = 1;
export const peekShownStep = () => lastShownStep;
export function markShown(step: number) {
  lastShownStep = step;
}

/** Resume should happen once per app launch, not every time the splash is revisited. */
let isResumeHandled = false;
/** Pure check (safe during render). */
export const isResumePending = () => !isResumeHandled;
export function markResumeHandled() {
  isResumeHandled = true;
}

/** Test hook. */
export function resetOnboardingNavigation() {
  lastShownStep = 1;
  isResumeHandled = false;
}

export function goNext(step: number) {
  useOnboardingStore.getState().reachStep(step + 1);
  router.push(hrefForStep(step + 1));
}

/** Skip ahead (e.g. past OB10 when blocking is off), recording progress. */
export function goToStep(step: number) {
  useOnboardingStore.getState().reachStep(step);
  router.push(hrefForStep(step));
}

/** Previous step, answers kept. Works whether or not the screen below is in the stack. */
export function goBack(step: number) {
  if (step <= 1) return;
  if (router.canGoBack()) router.back();
  else router.replace(hrefForStep(step - 1));
}

/** Swap the current screen for a step (E01 → OB10 / OB11), recording progress. */
export function replaceWithStep(step: number) {
  useOnboardingStore.getState().reachStep(step);
  router.replace(hrefForStep(step));
}

/** OB15 done: onboarding never shows again; Home replaces the whole flow. */
export function finishOnboarding() {
  useSettingsStore.getState().setOnboarded(true);
  router.replace('/today');
}
