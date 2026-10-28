import { drawForDay, markDone, redraw } from '@/features/challenges/rules';
import { CHALLENGES, challengeById } from '@/features/challenges/library';
import { focusReducer, type FocusState } from '@/features/focus/machine';
import {
  canUseEmergencyPass,
  passesLeftThisWeek,
  type EmergencyPassLog,
} from '@/features/rules/emergencyPasses';
import { isScheduleActive } from '@/features/rules/schedule';
import { addDays, daysBetween, isoWeekKey } from '@/lib/time';

describe('time', () => {
  test('addDays / daysBetween cross month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-10-01', '2026-10-08')).toBe(7);
  });

  test('ISO weeks start on Monday', () => {
    expect(isoWeekKey(new Date(2026, 9, 18))).toBe('2026-W42'); // Sunday
    expect(isoWeekKey(new Date(2026, 9, 19))).toBe('2026-W43'); // Monday
    expect(isoWeekKey(new Date(2027, 0, 1))).toBe('2026-W53');
  });
});

describe('morning draw', () => {
  const DAY = '2026-10-22';

  test('one card per difficulty, deterministic per day', () => {
    const d = drawForDay(DAY);
    expect(d.cards.map((id) => challengeById(id)!.difficulty)).toEqual(['easy', 'medium', 'hard']);
    expect(drawForDay(DAY)).toEqual(d);
    expect(d.redrawsLeft).toBe(1);
  });

  test('one redraw per day, same difficulty, never a duplicate', () => {
    const d = drawForDay(DAY);
    const r = redraw(d, 1);
    expect(r.cards[1]).not.toBe(d.cards[1]);
    expect(challengeById(r.cards[1])!.difficulty).toBe('medium');
    expect(new Set(r.cards).size).toBe(3);
    expect(r.redrawsLeft).toBe(0);
    expect(redraw(r, 0)).toBe(r);
  });

  test('done cards cannot be redrawn or completed twice', () => {
    const d = markDone(drawForDay(DAY), drawForDay(DAY).cards[0]);
    expect(redraw(d, 0)).toBe(d);
    expect(markDone(d, d.cards[0])).toBe(d);
    expect(markDone(d, 'not-in-draw')).toBe(d);
  });

  test('library covers every difficulty × verification type needed', () => {
    for (const diff of ['easy', 'medium', 'hard'] as const) {
      expect(CHALLENGES.filter((c) => c.difficulty === diff).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('focus session', () => {
  const idle: FocusState = { status: 'idle' };

  test('idle → running → done → idle', () => {
    const running = focusReducer(idle, { type: 'start', now: 0, minutes: 25, lockedCount: 4 });
    expect(running).toMatchObject({ status: 'running', endsAt: 25 * 60_000, lockedCount: 4 });
    expect(focusReducer(running, { type: 'tick', now: 60_000 })).toBe(running);
    const done = focusReducer(running, { type: 'tick', now: 25 * 60_000 });
    expect(done).toMatchObject({ status: 'done', minutes: 25 });
    expect(focusReducer(done, { type: 'acknowledge' })).toEqual(idle);
  });

  test('cannot be ended early', () => {
    const running = focusReducer(idle, { type: 'start', now: 0, minutes: 25, lockedCount: 0 });
    expect(focusReducer(running, { type: 'requestEarlyExit' })).toBe(running);
    expect(focusReducer(running, { type: 'acknowledge' })).toBe(running);
    expect(focusReducer(running, { type: 'start', now: 1, minutes: 5, lockedCount: 0 })).toBe(
      running,
    );
  });

  test('duration is clamped', () => {
    const s = focusReducer(idle, { type: 'start', now: 0, minutes: 1, lockedCount: 0 });
    expect(s.status === 'running' && s.endsAt).toBe(5 * 60_000);
  });
});

describe('emergency passes', () => {
  const monday = new Date(2026, 9, 19, 9).getTime();
  const log: EmergencyPassLog[] = [
    { at: monday, ruleId: 'r1', reason: 'work' },
    { at: monday + 3_600_000, ruleId: 'r1', reason: 'travel' },
  ];

  test('2 per ISO week, Pro only', () => {
    expect(passesLeftThisWeek([], monday)).toBe(2);
    expect(passesLeftThisWeek(log, monday + 86_400_000)).toBe(0);
    expect(canUseEmergencyPass(log, monday + 86_400_000, true)).toEqual({
      ok: false,
      reason: 'none_left',
    });
    expect(canUseEmergencyPass([], monday, false)).toEqual({ ok: false, reason: 'not_pro' });
    // Next Monday resets.
    expect(passesLeftThisWeek(log, monday + 7 * 86_400_000)).toBe(2);
  });
});

describe('rule schedules', () => {
  const weekdays = { days: [1, 2, 3, 4, 5] as const, start: '09:00', end: '17:00' };
  const overnight = { days: [0, 1, 2, 3, 4, 5, 6] as const, start: '22:00', end: '07:00' };

  test('daytime window', () => {
    const s = { ...weekdays, days: [...weekdays.days] };
    expect(isScheduleActive(s, new Date(2026, 9, 21, 10))).toBe(true); // Wed
    expect(isScheduleActive(s, new Date(2026, 9, 21, 17))).toBe(false);
    expect(isScheduleActive(s, new Date(2026, 9, 24, 10))).toBe(false); // Sat
  });

  test('overnight window belongs to its start day', () => {
    const s = { ...overnight, days: [...overnight.days] };
    expect(isScheduleActive(s, new Date(2026, 9, 21, 23))).toBe(true);
    expect(isScheduleActive(s, new Date(2026, 9, 22, 6, 59))).toBe(true);
    expect(isScheduleActive(s, new Date(2026, 9, 22, 7))).toBe(false);
    const fridayOnly = { ...s, days: [5 as const] };
    expect(isScheduleActive(fridayOnly, new Date(2026, 9, 24, 3))).toBe(true); // Sat 3am
    expect(isScheduleActive(fridayOnly, new Date(2026, 9, 25, 3))).toBe(false); // Sun 3am
  });
});
