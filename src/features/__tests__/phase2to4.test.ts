import { currentClarity } from '@/features/clarity/score';
import { defaultChip, LADDER_MAX, nextSessionMinutes, rungFor } from '@/features/focus/ladder';
import {
  earnedMinutesFor,
  focusReducer,
  pointsFor,
  type FocusState,
} from '@/features/focus/machine';
import {
  homeBanner,
  homeState,
  isBaseline,
  isGhostAnimated,
  percentChange,
  type HomeInputs,
} from '@/features/home/homeState';
import { longestFocusStat, opensResistedStat } from '@/features/home/stats';
import { nextMoment, weekWithProParts, type MomentInputs } from '@/features/paywall/moments';
import { parseSource, isContextual } from '@/features/paywall/paywallCopy';
import {
  loadReducer,
  OFFERINGS_TIMEOUT_MS,
  purchaseDestination,
  purchaseReducer,
} from '@/features/paywall/paywallMachine';
import type { Rule } from '@/features/rules/model';
import {
  activeUntil,
  canAddRule,
  daysKind,
  downgradeToFree,
  lockedUntil,
  nextStart,
  restoreAfterUpgrade,
  strictest,
  totalApps,
  validateRule,
} from '@/features/rules/rules';
import { mapPurchaseError } from '@/services/purchases/errors';

const rule = (over: Partial<Rule> & Pick<Rule, 'id'>): Rule => ({
  name: over.id,
  strength: 'earn',
  schedule: { days: [0, 1, 2, 3, 4, 5, 6], start: '09:00', end: '17:00' },
  apps: { platform: 'android', packages: ['a', 'b'] },
  enabled: true,
  createdAt: 0,
  ...over,
});

/** Thursday 22 Oct 2026, local time. */
const at = (h: number, m = 0) => new Date(2026, 9, 22, h, m);

describe('rules (FBlock / FRuleEdit)', () => {
  test('validation: ≥1 app, ≥1 day, From ≠ To; overnight is fine', () => {
    const base = { name: 'x', strength: 'earn' as const };
    expect(
      validateRule({ ...base, apps: null, schedule: { days: [], start: '09:00', end: '09:00' } }),
    ).toEqual(['noApps', 'noDays', 'sameTimes']);
    expect(
      validateRule({
        ...base,
        apps: { platform: 'ios', token: 't', count: 2 },
        schedule: { days: [1], start: '23:00', end: '07:00' },
      }),
    ).toEqual([]);
  });

  test('the strictest overlapping rule wins (Locked > Earn > Pause)', () => {
    const r = [
      rule({ id: 'p', strength: 'pause' }),
      rule({ id: 'l', strength: 'locked' }),
      rule({ id: 'e' }),
    ];
    expect(strictest(r)?.id).toBe('l');
    expect(strictest([])).toBeNull();
  });

  test('"until" uses the latest end among active rules; next start for the evening card', () => {
    const rules = [
      rule({ id: 'work', schedule: { days: [4], start: '09:00', end: '17:00' } }),
      rule({ id: 'bed', schedule: { days: [0, 1, 2, 3, 4, 5, 6], start: '23:00', end: '07:00' } }),
    ];
    expect(activeUntil(rules, at(10))).toBe('17:00');
    expect(activeUntil(rules, at(18))).toBeNull();
    expect(nextStart(rules, at(21, 40))).toEqual({ rule: rules[1], inMinutes: 80 });
  });

  test('app counts merge Android packages', () => {
    expect(
      totalApps([
        rule({ id: 'a', apps: { platform: 'android', packages: ['x', 'y'] } }),
        rule({ id: 'b', apps: { platform: 'android', packages: ['y', 'z'] } }),
      ]),
    ).toBe(3);
  });

  test('free plan: 2 rules; Pro: unlimited', () => {
    const two = [rule({ id: 'a' }), rule({ id: 'b' })];
    expect(canAddRule(two, false)).toBe(false);
    expect(canAddRule(two, true)).toBe(true);
    expect(canAddRule([two[0]!], false)).toBe(true);
  });

  test('an active Locked rule cannot be edited until it ends', () => {
    const locked = rule({
      id: 'l',
      strength: 'locked',
      schedule: { days: [4], start: '00:00', end: '12:00' },
    });
    expect(lockedUntil(locked, at(10))).toBe('12:00');
    expect(lockedUntil(locked, at(13))).toBeNull();
    expect(lockedUntil({ ...locked, strength: 'earn' }, at(10))).toBeNull();
  });

  test('downgrade: Locked → Earn, the 2 most recently used stay, the rest pause (P06)', () => {
    const rules = [
      rule({ id: 'old', strength: 'locked', lastUsedAt: 1 }),
      rule({ id: 'new', lastUsedAt: 30 }),
      rule({ id: 'mid', lastUsedAt: 20 }),
    ];
    const r = downgradeToFree(rules);
    expect(r.softened).toEqual(['old']);
    expect(r.kept.sort()).toEqual(['mid', 'new']);
    expect(r.paused).toEqual(['old']);
    expect(r.rules.find((x) => x.id === 'old')).toMatchObject({
      strength: 'earn',
      enabled: false,
      isPausedByPlan: true,
    });
    expect(restoreAfterUpgrade(r.rules).every((x) => x.enabled)).toBe(true);
  });

  test('day labels', () => {
    expect(daysKind([0, 1, 2, 3, 4, 5, 6])).toBe('everyDay');
    expect(daysKind([1, 2, 3, 4, 5])).toBe('weekdays');
    expect(daysKind([0, 6])).toBe('weekends');
    expect(daysKind([1, 3])).toBe('custom');
  });
});

describe('Home state (SPEC Home)', () => {
  const base: HomeInputs = {
    now: at(10),
    blocking: 'approved',
    isFocusRunning: false,
    challengesDone: 1,
    challengesTotal: 3,
    dayNumber: 12,
    isInGrace: false,
    isTrialCardPending: false,
  };

  test('priority off > focus > evening > day1 > idle', () => {
    expect(homeState(base)).toBe('idle');
    expect(homeState({ ...base, dayNumber: 1 })).toBe('day1');
    expect(homeState({ ...base, now: at(21), challengesDone: 3 })).toBe('evening');
    expect(homeState({ ...base, now: at(21), challengesDone: 2 })).toBe('idle');
    expect(homeState({ ...base, isFocusRunning: true, now: at(21), challengesDone: 3 })).toBe(
      'focus',
    );
    expect(homeState({ ...base, blocking: 'denied', isFocusRunning: true })).toBe('off');
    expect(homeState({ ...base, blocking: 'skipped' })).toBe('off');
  });

  test('banner priority blockingOff > grace > trial; ghost animates only idle with no banner', () => {
    expect(homeBanner({ ...base, isInGrace: true, isTrialCardPending: true })).toBe('grace');
    expect(homeBanner({ ...base, blocking: 'denied', isInGrace: true })).toBe('blockingOff');
    expect(homeBanner({ ...base, isTrialCardPending: true })).toBe('trial');
    expect(homeBanner(base)).toBeNull();
    expect(isGhostAnimated('idle', null)).toBe(true);
    expect(isGhostAnimated('idle', 'grace')).toBe(false);
    expect(isGhostAnimated('focus', null)).toBe(false);
  });

  test('baseline for days 1–7, and percent change', () => {
    expect(isBaseline(null)).toBe(true);
    expect(isBaseline(7)).toBe(true);
    expect(isBaseline(8)).toBe(false);
    expect(percentChange(41, 50)).toBe(-18);
    expect(percentChange(5, null)).toBeNull();
  });

  test('stats: longest locked focus vs the first week; opens resisted', () => {
    const DAY = 86_400_000;
    const first = 0;
    const s = [
      { endedAt: first + DAY, minutes: 34, isTimerOnly: false },
      { endedAt: 20 * DAY, minutes: 42, isTimerOnly: false },
      { endedAt: 20 * DAY, minutes: 90, isTimerOnly: true },
    ];
    expect(longestFocusStat(s, first, 21 * DAY)).toEqual({ minutes: 42, deltaPercent: 24 });
    const ev = (outcome: 'closed' | 'opened') =>
      ({ at: 10, appId: 'a', ruleId: 'r', strength: 'pause', outcome }) as const;
    expect(opensResistedStat([ev('closed'), ev('closed'), ev('opened')], 0)).toEqual({
      closed: 2,
      percent: 67,
    });
  });

  test('Clarity starts at the OB13 score and rises toward 100', () => {
    expect(currentClarity(41, null)).toBe(41);
    expect(currentClarity(40, 50)).toBe(70);
    expect(currentClarity(40, 100)).toBe(100);
  });
});

describe('focus (FFocusStart → FFocusDone)', () => {
  const idle: FocusState = { status: 'idle' };

  test('rewards: 50 min → +15 min app time, +25 points; timer-only earns nothing', () => {
    expect(earnedMinutesFor(50)).toBe(15);
    expect(pointsFor(50)).toBe(25);
    const run = focusReducer(idle, {
      type: 'start',
      now: 0,
      minutes: 50,
      lockedCount: 0,
      isTimerOnly: true,
    });
    const done = focusReducer(run, { type: 'tick', now: 50 * 60_000 });
    expect(done).toMatchObject({ status: 'done', earnedMinutes: 0, points: 0, isTimerOnly: true });
  });

  test('rehydrates from endsAt: a session that ended while closed is done on relaunch', () => {
    const run = focusReducer(idle, { type: 'start', now: 0, minutes: 25, lockedCount: 3 });
    expect(focusReducer(run, { type: 'tick', now: 3 * 60 * 60_000 })).toMatchObject({
      status: 'done',
      endedAt: 25 * 60_000,
      earnedMinutes: 8,
    });
  });

  test('attention ladder: +5 min a step, 12 rungs, chip default', () => {
    expect(nextSessionMinutes(null)).toBe(25);
    expect(nextSessionMinutes(50)).toBe(55);
    expect(nextSessionMinutes(500)).toBe(LADDER_MAX);
    expect(rungFor(50)).toBe(6);
    expect(defaultChip(55, [25, 50, 90])).toBe(50);
    expect(defaultChip(20, [25, 50, 90])).toBe(25);
  });
});

describe('paywall', () => {
  test('offerings: 8 s skeleton then offline; retry from offline', () => {
    const loading = { status: 'loading' as const, since: 0 };
    expect(loadReducer(loading, { type: 'tick', now: OFFERINGS_TIMEOUT_MS - 1 })).toBe(loading);
    expect(loadReducer(loading, { type: 'tick', now: OFFERINGS_TIMEOUT_MS })).toEqual({
      status: 'offline',
    });
    expect(loadReducer({ status: 'offline' }, { type: 'retry', now: 5 })).toEqual({
      status: 'loading',
      since: 5,
    });
  });

  test('purchase outcomes map 1:1 to edge screens; cancelled shows nothing', () => {
    const purchasing = purchaseReducer({ status: 'idle' }, { type: 'start', plan: 'yearly' });
    expect(purchaseReducer(purchasing, { type: 'result', outcome: 'cancelled' })).toEqual({
      status: 'idle',
    });
    expect(purchaseReducer(purchasing, { type: 'result', outcome: 'pending' })).toEqual({
      status: 'pending',
    });
    expect(purchaseReducer(purchasing, { type: 'result', outcome: 'failed' })).toEqual({
      status: 'failed',
      plan: 'yearly',
    });
    expect(purchaseDestination('cancelled')).toBe('stay');
    expect(purchaseDestination('failed')).toBe('failedSheet');
    expect(purchaseDestination('offline')).toBe('failedSheet');
    expect(purchaseDestination('pending')).toBe('pendingScreen');
    expect(purchaseDestination('success')).toBe('success');
  });

  test('RevenueCat error codes', () => {
    expect(mapPurchaseError({ code: '1' })).toBe('cancelled');
    expect(mapPurchaseError({ userCancelled: true })).toBe('cancelled');
    expect(mapPurchaseError({ code: '20' })).toBe('pending');
    expect(mapPurchaseError({ code: '10' })).toBe('offline');
    expect(mapPurchaseError({ code: '35' })).toBe('offline');
    expect(mapPurchaseError({ code: '2' })).toBe('failed');
    expect(mapPurchaseError(new Error('x'))).toBe('failed');
  });

  test('moments: P01 → P02 (day 5) → P03 (day 7) → P06; win-back after a 60-day lapse', () => {
    const seen = {
      trialCard: false,
      day5: false,
      remindOnDay7: false,
      expiry: false,
      wentFree: false,
      winBack: false,
    };
    const base: MomentInputs = {
      now: 0,
      trial: 'active',
      trialDay: 0,
      hasPurchased: false,
      proEndedAt: null,
      seen,
    };
    expect(nextMoment(base)).toBe('trialCard');
    expect(nextMoment({ ...base, seen: { ...seen, trialCard: true } })).toBeNull();
    expect(nextMoment({ ...base, trial: 'ending', trialDay: 5 })).toBe('day5');
    expect(
      nextMoment({
        ...base,
        trial: 'ending',
        trialDay: 6,
        seen: { ...seen, day5: true, remindOnDay7: true },
      }),
    ).toBe('day5');
    expect(nextMoment({ ...base, trial: 'expired', trialDay: 7 })).toBe('expiry');
    expect(
      nextMoment({ ...base, trial: 'expired', trialDay: 8, seen: { ...seen, expiry: true } }),
    ).toBe('wentFree');
    expect(nextMoment({ ...base, hasPurchased: true })).toBeNull();
    const DAY = 86_400_000;
    const lapsed = { ...base, proEndedAt: 0, seen: { ...seen, wentFree: true } };
    expect(nextMoment({ ...lapsed, now: 59 * DAY })).toBeNull();
    expect(nextMoment({ ...lapsed, now: 60 * DAY })).toBe('winBack');
  });

  test('P02 personal line drops zero counts', () => {
    expect(weekWithProParts({ locksHeld: 3, opensResisted: 0, passesUnused: 2 })).toEqual([
      'locksHeld',
      'passesUnused',
    ]);
    expect(weekWithProParts({ locksHeld: 0, opensResisted: 0, passesUnused: 0 })).toEqual([]);
  });

  test('?from= sources', () => {
    expect(parseSource('bedtime')).toBe('bedtime');
    expect(parseSource('nope')).toBeNull();
    expect(isContextual('bedtime')).toBe(true);
    expect(isContextual('expiry')).toBe(false);
    expect(isContextual(null)).toBe(false);
  });
});
