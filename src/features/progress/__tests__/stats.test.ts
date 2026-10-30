import { addDays } from '@/lib/time';

import {
  avgPickups,
  avgScreen,
  bars,
  daysWithData,
  firstWeekAverage,
  percentChange,
  periodDays,
  sumDetours,
  timeBackMs,
  type SummaryRow,
} from '../stats';

const H = 3_600_000;
const today = '2026-10-30';
const row = (offset: number, hours: number, extra: Partial<SummaryRow> = {}): SummaryRow => ({
  date: addDays(today, offset),
  screenTimeMs: hours * H,
  blockedTimeMs: 0,
  pickups: 70,
  detours: 1,
  gamesPlayed: 2,
  ...extra,
});

describe('progress stats', () => {
  it('builds the period', () => {
    const w = periodDays(today, 'week');
    expect(w).toHaveLength(7);
    expect(w[6]).toBe(today);
    expect(periodDays(today, 'month')).toHaveLength(30);
  });

  it('averages only days with data', () => {
    const rows = [row(0, 2), row(-1, 4), row(-2, 0)];
    expect(avgScreen(rows, periodDays(today, 'week'))).toBe(3 * H);
    expect(avgPickups(rows, periodDays(today, 'week'))).toBe(70);
  });

  it('percent change', () => {
    expect(percentChange(86, 100)).toBe(-14);
    expect(percentChange(5, null)).toBeNull();
    expect(percentChange(5, 0)).toBeNull();
  });

  it('time back against the first week', () => {
    const rows = [...Array.from({ length: 7 }, (_, i) => row(-13 + i, 4)), row(-1, 3), row(0, 5)];
    expect(firstWeekAverage(rows)).toBe(4 * H);
    expect(timeBackMs(rows, periodDays(today, 'week'))).toBe(1 * H);
  });

  it('no time back during the first week', () => {
    expect(timeBackMs([row(0, 1)], periodDays(today, 'week'))).toBe(0);
  });

  it('detours, bars and first-day state', () => {
    const rows = [row(0, 2, { blockedTimeMs: 0.5 * H }), row(-1, 1)];
    expect(sumDetours(rows, periodDays(today, 'week'))).toBe(2);
    const b = bars(rows, periodDays(today, 'week'));
    expect(b[6]).toEqual({ date: today, blocked: 30, other: 90 });
    expect(b[0]).toEqual({ date: addDays(today, -6), blocked: 0, other: 0 });
    expect(daysWithData([])).toBe(0);
    expect(daysWithData(rows)).toBe(2);
  });
});
