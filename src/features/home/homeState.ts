/**
 * Home's state machine (SPEC §5 Home), as pure functions so every state is unit-tested and the
 * dev menu can force any of them with fixtures.
 */

export type HomeStateKind = 'idle' | 'focus' | 'evening' | 'day1' | 'off';

/** One banner at a time, by priority. `offline` exists in the component but Home never shows
 * it: the app is offline-first, so a global offline banner would be noise (EDGE_CASES). */
export type HomeBannerKind = 'blockingOff' | 'grace' | 'trial';

export type HomeInputs = {
  /** Local time. */
  now: Date;
  /** Screen Time / usage access. `skipped` = E01 "Continue without blocking". */
  blocking: 'approved' | 'denied' | 'notDetermined' | 'skipped';
  isFocusRunning: boolean;
  challengesDone: number;
  challengesTotal: number;
  /** 1-based day since the first rule went on (trial start), null before that. */
  dayNumber: number | null;
  /** Store billing retry in progress (P11). */
  isInGrace: boolean;
  /** P01 card not dismissed yet. */
  isTrialCardPending: boolean;
};

export const EVENING_HOUR = 20;
export const BASELINE_DAYS = 7;

/** Priority: off > focus > evening > day1 > idle. */
export function homeState(i: HomeInputs): HomeStateKind {
  if (i.blocking !== 'approved') return 'off';
  if (i.isFocusRunning) return 'focus';
  if (i.now.getHours() >= EVENING_HOUR && i.challengesDone >= i.challengesTotal) return 'evening';
  if (i.dayNumber !== null && i.dayNumber <= BASELINE_DAYS) return 'day1';
  return 'idle';
}

/** blockingOff > grace > trial (P01). */
export function homeBanner(i: HomeInputs): HomeBannerKind | null {
  if (i.blocking !== 'approved') return 'blockingOff';
  if (i.isInGrace) return 'grace';
  if (i.isTrialCardPending) return 'trial';
  return null;
}

/** The ghost loops only when idle and nothing else asks for attention. */
export function isGhostAnimated(state: HomeStateKind, banner: HomeBannerKind | null): boolean {
  return state === 'idle' && banner === null;
}

/** Stats show the baseline card for the first week (HomeBDay1). */
export function isBaseline(dayNumber: number | null): boolean {
  return dayNumber === null || dayNumber <= BASELINE_DAYS;
}

/** Percent change vs a baseline, as a signed integer ("−18%"). Null without a baseline. */
export function percentChange(value: number, baseline: number | null): number | null {
  if (baseline === null || baseline === 0) return null;
  return Math.round(((value - baseline) / baseline) * 100);
}
