import {
  hasProAccess,
  initialTrialState,
  onRuleEnabled,
  shouldShowExpiryPaywall,
  trialDaysLeft,
  trialMilestones,
  trialPhase,
  TRIAL_DAYS,
  trialDayNumber,
} from '@/features/paywall/trial';
import { DAY } from '@/lib/time';

// Local noon avoids DST edge cases in the fixture itself.
const START = new Date(2026, 9, 1, 12, 0).getTime();
const at = (days: number, hours = 0) => START + days * DAY + hours * 3_600_000;

describe('reverse trial', () => {
  test('nothing happens until the first rule is switched on', () => {
    expect(trialPhase(initialTrialState, at(30))).toBe('not_started');
    expect(hasProAccess(initialTrialState, at(30), false)).toBe(false);
    expect(trialDaysLeft(initialTrialState, at(30))).toBe(TRIAL_DAYS);
  });

  test('day 0 → active, day 5 → ending, day 7 → expired', () => {
    const s = onRuleEnabled(initialTrialState, START);
    expect(trialPhase(s, at(0))).toBe('active');
    expect(trialPhase(s, at(4, 11))).toBe('active');
    expect(trialPhase(s, at(5))).toBe('ending');
    expect(trialPhase(s, at(6, 11))).toBe('ending');
    expect(trialPhase(s, at(7))).toBe('expired');
    expect(trialDaysLeft(s, at(5))).toBe(2);
    expect(trialDaysLeft(s, at(9))).toBe(0);
  });

  test('phase follows calendar days, not 24h blocks', () => {
    const lateNight = new Date(2026, 9, 1, 23, 50).getTime();
    const s = onRuleEnabled(initialTrialState, lateNight);
    expect(trialPhase(s, new Date(2026, 9, 6, 0, 5).getTime())).toBe('ending');
  });

  test('enabling more rules never restarts the trial', () => {
    const s = onRuleEnabled(initialTrialState, START);
    expect(onRuleEnabled(s, at(6))).toBe(s);
  });

  test('pro access: purchase overrides, trial grants until expiry', () => {
    const s = onRuleEnabled(initialTrialState, START);
    expect(hasProAccess(s, at(3), false)).toBe(true);
    expect(hasProAccess(s, at(7), false)).toBe(false);
    expect(hasProAccess(s, at(7), true)).toBe(true);
  });

  test('expiry paywall shows once, never for paying users', () => {
    const s = onRuleEnabled(initialTrialState, START);
    expect(shouldShowExpiryPaywall(s, at(6), false)).toBe(false);
    expect(shouldShowExpiryPaywall(s, at(7), false)).toBe(true);
    expect(shouldShowExpiryPaywall({ ...s, expiryPaywallSeen: true }, at(7), false)).toBe(false);
    expect(shouldShowExpiryPaywall(s, at(7), true)).toBe(false);
  });

  test('milestones for local notifications', () => {
    expect(trialMilestones(START)).toEqual({ noticeAt: at(5), endsAt: at(7) });
  });

  test('days 0, 5, 7 and 8: DAY n OF 7, phases, Pro access', () => {
    const s = onRuleEnabled(initialTrialState, START);
    expect(trialDayNumber(s, at(0))).toBe(1);
    expect(trialDayNumber(s, at(5))).toBe(6);
    expect(trialDayNumber(s, at(7))).toBe(7);
    expect(trialPhase(s, at(8))).toBe('expired');
    expect(hasProAccess(s, at(8), false)).toBe(false);
    expect(trialDaysLeft(s, at(8))).toBe(0);
  });

  test('timezone changes neither shorten nor extend the trial', () => {
    // Started on 1 Oct local; the stored start *day* is kept even if the device later moves
    // across timezones (startedAt alone would map to 30 Sep or 2 Oct elsewhere).
    const s = { ...onRuleEnabled(initialTrialState, START), startDay: '2026-10-01' };
    const shifted = { ...s, startedAt: START - 11 * 3_600_000 };
    expect(trialPhase(shifted, at(5))).toBe(trialPhase(s, at(5)));
    expect(trialPhase(shifted, at(7))).toBe('expired');
    expect(trialPhase(shifted, at(6, 11))).toBe('ending');
    expect(trialDayNumber(shifted, at(0))).toBe(1);
  });
});
