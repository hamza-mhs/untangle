import { clarityScore } from '@/features/scoring/clarity';
import { verifiedPercent, WORD_DAILY_CAP } from '@/features/challenges/rules';
import {
  balance,
  challengeReward,
  wordPointsOnDay,
  type LedgerEntry,
} from '@/features/scoring/points';
import { computeStreak, settleMissedDays } from '@/features/scoring/streak';
import { addDays } from '@/lib/time';

const TODAY = '2026-10-22';

describe('points', () => {
  test('points by difficulty: 10 / 15 / 25, whatever the check', () => {
    expect(challengeReward({ difficulty: 'easy', verification: 'timed' }, 0)).toEqual({
      points: 10,
      minutes: 5,
    });
    expect(challengeReward({ difficulty: 'medium', verification: 'verified' }, 0).points).toBe(15);
    expect(challengeReward({ difficulty: 'hard', verification: 'verified' }, 0)).toEqual({
      points: 25,
      minutes: 15,
    });
  });

  test('"Your word" earns no minutes and is capped per day', () => {
    const first = challengeReward({ difficulty: 'hard', verification: 'word' }, 0);
    expect(first.minutes).toBe(0);
    expect(first.points).toBe(Math.min(25, WORD_DAILY_CAP));
    const second = challengeReward({ difficulty: 'hard', verification: 'word' }, first.points);
    expect(first.points + second.points).toBe(WORD_DAILY_CAP);
    const third = challengeReward({ difficulty: 'easy', verification: 'word' }, WORD_DAILY_CAP);
    expect(third.points).toBe(0);
  });

  test('balance, word points and verified share from a ledger', () => {
    const ledger: LedgerEntry[] = [
      {
        at: 1,
        day: TODAY,
        kind: 'challenge',
        points: 15,
        minutes: 5,
        verification: 'verified',
        ref: null,
      },
      {
        at: 2,
        day: TODAY,
        kind: 'challenge',
        points: 10,
        minutes: 0,
        verification: 'word',
        ref: null,
      },
      {
        at: 3,
        day: TODAY,
        kind: 'challenge',
        points: 20,
        minutes: 10,
        verification: 'timed',
        ref: null,
      },
      { at: 4, day: TODAY, kind: 'spend', points: 0, minutes: -10, verification: null, ref: null },
    ];
    expect(balance(ledger)).toEqual({ points: 45, minutes: 5 });
    expect(wordPointsOnDay(ledger, TODAY)).toBe(10);
    expect(wordPointsOnDay(ledger, '2026-10-21')).toBe(0);
    // Timed counts as verified: (15 + 20) of 45.
    expect(verifiedPercent(ledger)).toBe(78);
    expect(verifiedPercent([])).toBeNull();
  });
});

describe('streak', () => {
  const none = new Set<string>();

  test('a day counts with at least one challenge', () => {
    const completedByDay = { [TODAY]: 1, [addDays(TODAY, -1)]: 3, [addDays(TODAY, -2)]: 1 };
    expect(computeStreak({ completedByDay, frozenDays: none, today: TODAY })).toBe(3);
  });

  test('an empty today does not break the streak yet', () => {
    const completedByDay = { [addDays(TODAY, -1)]: 1, [addDays(TODAY, -2)]: 2 };
    expect(computeStreak({ completedByDay, frozenDays: none, today: TODAY })).toBe(2);
  });

  test('a missed day breaks it', () => {
    const completedByDay = { [TODAY]: 1, [addDays(TODAY, -2)]: 1 };
    expect(computeStreak({ completedByDay, frozenDays: none, today: TODAY })).toBe(1);
  });

  test('a frozen day bridges the gap without adding to it', () => {
    const completedByDay = { [TODAY]: 1, [addDays(TODAY, -2)]: 1, [addDays(TODAY, -3)]: 1 };
    const frozenDays = new Set([addDays(TODAY, -1)]);
    expect(computeStreak({ completedByDay, frozenDays, today: TODAY })).toBe(3);
  });

  test('settleMissedDays spends freezes oldest-first and stops when out', () => {
    const lastSettled = addDays(TODAY, -4);
    const completedByDay = { [addDays(TODAY, -2)]: 1 };
    const r = settleMissedDays({ lastSettled, today: TODAY, completedByDay, freezes: 1 });
    expect(r).toEqual({ frozen: [addDays(TODAY, -3)], freezesLeft: 0 });

    const r2 = settleMissedDays({ lastSettled, today: TODAY, completedByDay, freezes: 5 });
    expect(r2).toEqual({ frozen: [addDays(TODAY, -3), addDays(TODAY, -1)], freezesLeft: 3 });
  });

  test('settling on the same or next day spends nothing', () => {
    expect(
      settleMissedDays({ lastSettled: TODAY, today: TODAY, completedByDay: {}, freezes: 2 }),
    ).toEqual({ frozen: [], freezesLeft: 2 });
    expect(
      settleMissedDays({
        lastSettled: addDays(TODAY, -1),
        today: TODAY,
        completedByDay: {},
        freezes: 2,
      }),
    ).toEqual({ frozen: [], freezesLeft: 2 });
  });
});

describe('clarity (habit score)', () => {
  test('0 with no history, 100 with all challenges every day', () => {
    expect(clarityScore({ completedByDay: {}, today: TODAY, firstDay: TODAY })).toBe(0);
    const full = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [addDays(TODAY, -i), 3]));
    expect(
      clarityScore({ completedByDay: full, today: TODAY, firstDay: addDays(TODAY, -30) }),
    ).toBe(100);
  });

  test('recent days weigh more than old ones', () => {
    const recent = { [TODAY]: 3 };
    const old = { [addDays(TODAY, -10)]: 3 };
    const firstDay = addDays(TODAY, -13);
    expect(clarityScore({ completedByDay: recent, today: TODAY, firstDay })).toBeGreaterThan(
      clarityScore({ completedByDay: old, today: TODAY, firstDay }),
    );
  });

  test('ignores days before the user started', () => {
    expect(clarityScore({ completedByDay: { [TODAY]: 3 }, today: TODAY, firstDay: TODAY })).toBe(
      100,
    );
  });
});
