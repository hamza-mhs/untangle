import {
  clampMinutes,
  clampOpens,
  hasLimit,
  isLoosening,
  isOverLimit,
  lockStatus,
  needsGameFirst,
  pausedByPlan,
  setMinutes,
  summaryOf,
  usedFraction,
  type LockChange,
} from '../allowance';
import type { Lock } from '../types';

const lock = (over: Partial<Lock> = {}): Lock => ({
  id: 'l1',
  target: { kind: 'app', packageName: 'com.instagram.android', label: 'Instagram' },
  dailyMinutes: 30,
  dailyOpens: null,
  strictness: 'gentle',
  enabled: true,
  createdAt: 0,
  ...over,
});
const c = (usedMin: number, opens = 0, unlocksUsed = 0) => ({
  usedMs: usedMin * 60_000,
  opens,
  unlocksUsed,
});

describe('allowance draft', () => {
  it('clamps custom values', () => {
    expect(clampMinutes(2)).toBe(5);
    expect(clampMinutes(37)).toBe(35);
    expect(clampMinutes(500)).toBe(240);
    expect(clampOpens(0)).toBe(1);
    expect(clampOpens(99)).toBe(50);
  });
  it('needs at least one limit', () => {
    expect(hasLimit({ dailyMinutes: null, dailyOpens: null })).toBe(false);
    expect(hasLimit({ dailyMinutes: null, dailyOpens: 3 })).toBe(true);
    expect(hasLimit({ dailyMinutes: 0, dailyOpens: null })).toBe(true);
  });
  it('block all day clears opens', () => {
    expect(setMinutes({ dailyMinutes: 30, dailyOpens: 5 }, 0)).toEqual({
      dailyMinutes: 0,
      dailyOpens: null,
    });
    expect(setMinutes({ dailyMinutes: 0, dailyOpens: null }, 15)).toEqual({
      dailyMinutes: 15,
      dailyOpens: null,
    });
  });
  it('picks the summary sentence', () => {
    expect(summaryOf({ dailyMinutes: 0, dailyOpens: null }).key).toBe('allDay');
    expect(summaryOf({ dailyMinutes: 30, dailyOpens: 5 })).toEqual({
      key: 'both',
      minutes: 30,
      opens: 5,
    });
    expect(summaryOf({ dailyMinutes: null, dailyOpens: 5 })).toEqual({ key: 'opens', opens: 5 });
    expect(summaryOf({ dailyMinutes: null, dailyOpens: null }).key).toBe('none');
  });
});

describe('lockStatus', () => {
  it('covers every row state', () => {
    expect(lockStatus(lock({ enabled: false }), c(0), true).kind).toBe('off');
    expect(lockStatus(lock(), c(0), false).kind).toBe('notInstalled');
    expect(lockStatus(lock({ target: { kind: 'site', domain: 'x.com' } }), c(0), false).kind).toBe(
      'allowed',
    );
    expect(lockStatus(lock({ dailyMinutes: 0 }), c(0), true).kind).toBe('allDay');
    expect(lockStatus(lock(), c(30), true).kind).toBe('over');
    expect(lockStatus(lock(), c(12, 2), true)).toEqual({
      kind: 'allowed',
      usedMin: 12,
      minutes: 30,
      opens: 2,
      maxOpens: null,
    });
  });
  it('an active unlock is not over', () => {
    expect(lockStatus(lock(), c(31), true, 1000, 2000).kind).toBe('allowed');
  });
});

describe('limits', () => {
  it('over by time or by the open that went over', () => {
    expect(isOverLimit(lock(), c(29))).toBe(false);
    expect(isOverLimit(lock(), c(30))).toBe(true);
    expect(isOverLimit(lock({ dailyMinutes: null, dailyOpens: 3 }), c(0, 3))).toBe(false);
    expect(isOverLimit(lock({ dailyMinutes: null, dailyOpens: 3 }), c(0, 4))).toBe(true);
  });
  it('ring fraction', () => {
    expect(usedFraction(lock(), c(15))).toBeCloseTo(0.5);
    expect(usedFraction(lock({ dailyOpens: 4 }), c(3, 3))).toBeCloseTo(0.75);
    expect(usedFraction(lock({ dailyMinutes: 0 }), undefined)).toBe(1);
    expect(usedFraction(lock(), c(90))).toBe(1);
  });
});

describe('loosening rule matrix', () => {
  const cases: [LockChange, boolean][] = [
    [{ kind: 'disable' }, true],
    [{ kind: 'delete' }, true],
    [{ kind: 'enable' }, false],
    [{ kind: 'strictness', next: 'firm' }, false],
    [{ kind: 'strictness', next: 'gentle' }, false],
    [{ kind: 'allowance', next: { dailyMinutes: 45, dailyOpens: null } }, true],
    [{ kind: 'allowance', next: { dailyMinutes: 15, dailyOpens: null } }, false],
    [{ kind: 'allowance', next: { dailyMinutes: null, dailyOpens: 5 } }, true],
    [{ kind: 'allowance', next: { dailyMinutes: 30, dailyOpens: 5 } }, false],
  ];
  it.each(cases)('%j loosens: %s', (change, loosens) => {
    expect(isLoosening(lock(), change)).toBe(loosens);
  });
  it('lowering strictness loosens', () => {
    expect(
      isLoosening(lock({ strictness: 'locked' }), { kind: 'strictness', next: 'gentle' }),
    ).toBe(true);
  });
  it('only needs a game while blocking right now', () => {
    expect(needsGameFirst(lock(), { kind: 'disable' }, c(10))).toBe(false);
    expect(needsGameFirst(lock(), { kind: 'disable' }, c(30))).toBe(true);
    expect(
      needsGameFirst(
        lock(),
        { kind: 'allowance', next: { dailyMinutes: 15, dailyOpens: null } },
        c(30),
      ),
    ).toBe(false);
    expect(needsGameFirst(lock({ enabled: false }), { kind: 'delete' }, c(99))).toBe(false);
  });
});

describe('pausedByPlan', () => {
  const ls = [1, 2, 3, 4, 5].map((n) => lock({ id: `l${n}`, createdAt: n }));
  it('pauses nothing on Pro or with 3 or fewer', () => {
    expect(pausedByPlan(ls, true, []).size).toBe(0);
    expect(pausedByPlan(ls.slice(0, 3), false, []).size).toBe(0);
  });
  it('keeps the oldest three by default', () => {
    expect([...pausedByPlan(ls, false, [])].sort()).toEqual(['l4', 'l5']);
  });
  it('keeps the chosen three', () => {
    expect([...pausedByPlan(ls, false, ['l5', 'l4', 'l1'])].sort()).toEqual(['l2', 'l3']);
  });
  it('ignores disabled locks', () => {
    const mixed = [...ls.slice(0, 3), lock({ id: 'off', enabled: false, createdAt: 0 })];
    expect(pausedByPlan(mixed, false, []).size).toBe(0);
  });
});
