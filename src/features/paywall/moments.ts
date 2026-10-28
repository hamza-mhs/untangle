import { TRIAL_DAYS, TRIAL_NOTICE_DAY, type TrialPhase } from './trial';

/**
 * Which pricing moment Home shows on open (SPEC Pricing). One at a time, each at most once:
 *   P01 card   first Home after OB15 (trial day 1)
 *   P02 sheet  first open on trial day 5 (or "Remind me on day 7" → day 7 instead)
 *   P03        day 7, first open, no purchase (closable from frame 1)
 *   P06 sheet  after day 7 with no purchase, or after a lapse
 *   P12        once, 60+ days after Pro ended
 */
export type PaywallMoment = 'trialCard' | 'day5' | 'expiry' | 'wentFree' | 'winBack';

export const WIN_BACK_AFTER_DAYS = 60;
const DAY = 24 * 60 * 60 * 1000;

export type MomentInputs = {
  now: number;
  trial: TrialPhase;
  /** Elapsed trial days (0 = start day), null before the trial. */
  trialDay: number | null;
  hasPurchased: boolean;
  /** When paid Pro last ended, if it did. */
  proEndedAt: number | null;
  seen: {
    trialCard: boolean;
    day5: boolean;
    /** P02 "Remind me on day 7": show it again on day 7 instead of P03 first. */
    remindOnDay7: boolean;
    expiry: boolean;
    wentFree: boolean;
    winBack: boolean;
  };
};

export function nextMoment(i: MomentInputs): PaywallMoment | null {
  if (i.hasPurchased) return null;
  // A lapse after paying: P06 once, then P12 after 60 days.
  if (i.proEndedAt !== null) {
    if (!i.seen.wentFree) return 'wentFree';
    if (!i.seen.winBack && i.now - i.proEndedAt >= WIN_BACK_AFTER_DAYS * DAY) return 'winBack';
    return null;
  }
  if (i.trial === 'not_started' || i.trialDay === null) return null;
  if (i.trial === 'expired') {
    if (!i.seen.expiry) return 'expiry';
    if (!i.seen.wentFree) return 'wentFree';
    return null;
  }
  if (i.trialDay >= TRIAL_NOTICE_DAY) {
    if (!i.seen.day5) return 'day5';
    if (i.seen.remindOnDay7 && i.trialDay >= TRIAL_DAYS - 1) return 'day5';
    return null;
  }
  if (!i.seen.trialCard) return 'trialCard';
  return null;
}

/** P02 personal line: "3 locks held, 14 opens resisted, 2 emergency passes left unused."
 * Any count that is 0 is dropped; with all zero there's no line. */
export function weekWithProParts(counts: {
  locksHeld: number;
  opensResisted: number;
  passesUnused: number;
}): ('locksHeld' | 'opensResisted' | 'passesUnused')[] {
  return (['locksHeld', 'opensResisted', 'passesUnused'] as const).filter((k) => counts[k] > 0);
}
