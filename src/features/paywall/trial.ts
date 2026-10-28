import { DAY, daysBetween, dayKey, type DayKey } from '@/lib/time';

/**
 * Reverse trial (no card, app-side): Pro unlocks the moment the first rule switches on (day 0).
 * Day 5 → P02 notice. Day 7 → expired → closable paywall (P03), then free (P06).
 *
 * Days are counted in *local calendar days* from the start day, which is stored as a day key.
 * Travelling across timezones therefore never shortens or lengthens the trial by a day: the
 * start stays "the day you started" and today is today wherever you are.
 * The start is mirrored to the iOS Keychain so a reinstall doesn't restart it
 * (features/trial/secureFlag.ts; DECIDED: Keychain mirror).
 */

export const TRIAL_DAYS = 7;
export const TRIAL_NOTICE_DAY = 5;

export type TrialPhase = 'not_started' | 'active' | 'ending' | 'expired';

export type TrialState = {
  startedAt: number | null;
  /** Local day key of the start, fixed at start time (timezone-proof day counting). */
  startDay?: DayKey | null;
  /** Paywall shown at least once after expiry. */
  expiryPaywallSeen: boolean;
};

export const initialTrialState: TrialState = {
  startedAt: null,
  startDay: null,
  expiryPaywallSeen: false,
};

function startDayOf(state: TrialState): DayKey | null {
  if (state.startedAt === null) return null;
  return state.startDay ?? dayKey(state.startedAt);
}

/** Days elapsed since the start day (0 on the start day). */
export function trialDaysElapsed(state: TrialState, now: number): number | null {
  const start = startDayOf(state);
  return start === null ? null : daysBetween(start, dayKey(now));
}

/** "DAY n OF 7" (1-based), clamped to 1…7. */
export function trialDayNumber(state: TrialState, now: number): number | null {
  const elapsed = trialDaysElapsed(state, now);
  return elapsed === null ? null : Math.min(TRIAL_DAYS, Math.max(1, elapsed + 1));
}

export function trialPhase(state: TrialState, now: number): TrialPhase {
  const day = trialDaysElapsed(state, now);
  if (day === null) return 'not_started';
  if (day >= TRIAL_DAYS) return 'expired';
  if (day >= TRIAL_NOTICE_DAY) return 'ending';
  return 'active';
}

/** Event: a rule was switched on. Starts the trial only the first time. */
export function onRuleEnabled(state: TrialState, now: number): TrialState {
  return state.startedAt === null ? { ...state, startedAt: now, startDay: dayKey(now) } : state;
}

export function trialDaysLeft(state: TrialState, now: number): number {
  const day = trialDaysElapsed(state, now);
  return day === null ? TRIAL_DAYS : Math.max(0, TRIAL_DAYS - day);
}

/** Pro features are on if the user paid, or the trial is running. */
export function hasProAccess(state: TrialState, now: number, purchasedPro: boolean): boolean {
  if (purchasedPro) return true;
  const phase = trialPhase(state, now);
  return phase === 'active' || phase === 'ending';
}

export function shouldShowExpiryPaywall(state: TrialState, now: number, purchasedPro: boolean) {
  return !purchasedPro && !state.expiryPaywallSeen && trialPhase(state, now) === 'expired';
}

/** Local-notification times derived from the start (scheduled by features/trial). */
export function trialMilestones(startedAt: number) {
  return {
    noticeAt: startedAt + TRIAL_NOTICE_DAY * DAY,
    endsAt: startedAt + TRIAL_DAYS * DAY,
  };
}
