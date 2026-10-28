import { startingClarity } from '@/features/clarity/score';
import { buildFirstRules } from '@/features/onboarding/logic/firstRules';
import {
  countdownParts,
  initialQuietState,
  quietReducer,
  QUIET_MINUTE_MS,
  remainingAt,
} from '@/features/onboarding/logic/quietMinute';
import {
  daysPerYear,
  formatGain,
  formatHours,
  goodNews,
  hoursPerDay,
  yearBodyKey,
} from '@/features/onboarding/logic/yearMath';
import { SCREEN_TIME_BUCKETS } from '@/features/onboarding/types';
import { cubicBezier, moodToTimeline, sampleNumber } from '@/design/components/Ghost/timeline';

describe('OB06 year maths', () => {
  test.each([
    ['lt2', 1.5, 23],
    ['2-4', 3, 46],
    ['4-6', 5, 76],
    ['6-8', 7, 106],
    ['8+', 9, 137],
    ['unsure', 5, 76],
  ] as const)('%s → %s h → %s days', (bucket, hours, days) => {
    expect(hoursPerDay(bucket)).toBe(hours);
    expect(daysPerYear(hours)).toBe(days);
  });

  test('no answer counts as "not sure"', () => {
    expect(hoursPerDay(null)).toBe(5);
  });

  test('body copy thresholds: 30 and 60 days', () => {
    expect(yearBodyKey(23)).toBe('days');
    expect(yearBodyKey(29)).toBe('days');
    expect(yearBodyKey(30)).toBe('month');
    expect(yearBodyKey(59)).toBe('month');
    expect(yearBodyKey(60)).toBe('twoMonths');
    expect(yearBodyKey(137)).toBe('twoMonths');
  });

  test('formula card hours', () => {
    expect(formatHours(1.5)).toBe('1.5');
    expect(formatHours(5)).toBe('5');
  });
});

describe('OB07 good news', () => {
  test('design sample: 76 → 61 days, an hour a day, 15 days back', () => {
    const g = goodNews(76);
    expect(g).toMatchObject({ goal: 'hour', now: 76, withUs: 61 });
    expect(formatGain(g.gain)).toBe('15');
    expect(g.ratio).toBeCloseTo(61 / 76);
  });

  test('every OB02 bucket keeps a positive "With us" bar', () => {
    for (const b of SCREEN_TIME_BUCKETS) {
      const g = goodNews(daysPerYear(hoursPerDay(b)));
      expect(g.withUs).toBeGreaterThan(0);
      expect(g.ratio).toBeGreaterThan(0);
      expect(g.ratio).toBeLessThan(1);
    }
  });

  test('≤ 15 days switches to 30 minutes a day (7.6 days), never zero or negative', () => {
    const g = goodNews(15);
    expect(g.goal).toBe('halfHour');
    expect(formatGain(g.gain)).toBe('7.6');
    expect(g.withUs).toBe(7);
    for (const d of [0, 1, 5, 8]) {
      const small = goodNews(d);
      expect(small.withUs).toBeGreaterThanOrEqual(1);
      expect(small.ratio).toBeGreaterThan(0);
    }
    expect(goodNews(16).goal).toBe('hour');
  });
});

describe('starting Clarity (OB13)', () => {
  test('55 − 3 × hours − 2 × triggers, within 30–55', () => {
    expect(startingClarity({ screenTime: 'lt2', when: [] })).toBe(51); // 55 − 4.5 → 50.5 → 51
    expect(startingClarity({ screenTime: '4-6', when: ['morning', 'bed'] })).toBe(36);
    expect(startingClarity({ screenTime: '8+', when: ['morning', 'bed', 'work'] })).toBe(30);
    expect(startingClarity({ screenTime: null, when: [] })).toBe(40);
  });

  test('every combination stays in range', () => {
    for (const b of SCREEN_TIME_BUCKETS) {
      for (let n = 0; n <= 5; n++) {
        const when = (['morning', 'bed', 'work', 'bored', 'stressed'] as const).slice(0, n);
        const v = startingClarity({ screenTime: b, when });
        expect(v).toBeGreaterThanOrEqual(30);
        expect(v).toBeLessThanOrEqual(55);
      }
    }
  });
});

describe('OB12 quiet minute', () => {
  test('waiting → running → paused → running → done', () => {
    let s = quietReducer(initialQuietState, { type: 'tick', now: 0 });
    expect(s.phase).toBe('waiting');
    s = quietReducer(s, { type: 'down', now: 1_000 });
    expect(s.phase).toBe('running');
    expect(remainingAt(s, 19_000)).toBe(42_000);
    s = quietReducer(s, { type: 'up', now: 19_000 });
    expect(s).toEqual({ phase: 'paused', elapsedMs: 18_000, runningSince: null });
    // Time while lifted doesn't count.
    expect(remainingAt(s, 99_000)).toBe(42_000);
    s = quietReducer(s, { type: 'down', now: 100_000 });
    s = quietReducer(s, { type: 'tick', now: 100_000 + 42_000 });
    expect(s.phase).toBe('done');
    expect(remainingAt(s, 1e9)).toBe(0);
  });

  test('lifting while waiting does nothing; done is final', () => {
    expect(quietReducer(initialQuietState, { type: 'up', now: 5 })).toBe(initialQuietState);
    const done = { phase: 'done', elapsedMs: QUIET_MINUTE_MS, runningSince: null } as const;
    expect(quietReducer(done, { type: 'down', now: 1 })).toBe(done);
  });

  test('countdown parts', () => {
    expect(countdownParts(60_000)).toEqual({ minutes: '1m', seconds: '00s' });
    expect(countdownParts(42_000)).toEqual({ minutes: '0m', seconds: '42s' });
    expect(countdownParts(8_200)).toEqual({ minutes: '0m', seconds: '09s' });
    expect(countdownParts(-5)).toEqual({ minutes: '0m', seconds: '00s' });
  });
});

describe('first rules (OB15)', () => {
  const apps = { platform: 'ios', token: 't', count: 3 } as const;
  const names = { bedtime: 'Bedtime', mornings: 'Mornings' };

  test('bedtime always, mornings only with the "morning" trigger', () => {
    const one = buildFirstRules({ apps, strength: 'earn', when: ['bed'], names, now: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]).toMatchObject({
      name: 'Bedtime',
      strength: 'earn',
      enabled: true,
      schedule: { start: '23:00', end: '07:00', days: [0, 1, 2, 3, 4, 5, 6] },
    });
    const two = buildFirstRules({ apps, strength: 'locked', when: ['morning'], names, now: 1 });
    expect(two.map((r) => r.schedule.start)).toEqual(['23:00', '07:00']);
    expect(new Set(two.map((r) => r.id)).size).toBe(2);
  });
});

describe('ghost timeline', () => {
  test('cubic-bezier endpoints and linear identity', () => {
    expect(cubicBezier(0.45, 0, 0.2, 1, 0)).toBe(0);
    expect(cubicBezier(0.45, 0, 0.2, 1, 1)).toBe(1);
    expect(cubicBezier(0, 0, 1, 1, 0.3)).toBeCloseTo(0.3, 3);
    expect(cubicBezier(0.42, 0, 0.58, 1, 0.5)).toBeCloseTo(0.5, 3);
  });

  test('mood maps onto the designer keyframes', () => {
    expect(moodToTimeline(0)).toBeCloseTo(0.1);
    expect(moodToTimeline(0.5)).toBeCloseTo(0.3);
    expect(moodToTimeline(1)).toBeCloseTo(0.6);
    expect(moodToTimeline(2)).toBeCloseTo(0.6);
  });

  test('sampling holds between equal keyframes', () => {
    const values = [0, 0, 1, 1];
    const times = [0, 0.1, 0.3, 1];
    expect(sampleNumber(values, times, undefined, 0.05)).toBe(0);
    expect(sampleNumber(values, times, undefined, 0.2)).toBeCloseTo(0.5);
    expect(sampleNumber(values, times, undefined, 0.6)).toBe(1);
  });
});
