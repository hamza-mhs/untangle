import { addDays, type DayKey } from '@/lib/time';

/** Progress maths (20-phase2-core-app §5). Pure. */

export type SummaryRow = {
  date: DayKey;
  screenTimeMs: number;
  blockedTimeMs: number;
  pickups: number | null;
  detours: number;
  gamesPlayed: number;
};

export type Period = 'week' | 'month';
export const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 30 };

/** Days of the period ending today, oldest first. */
export function periodDays(today: DayKey, period: Period): DayKey[] {
  const n = PERIOD_DAYS[period];
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}

export function average(values: readonly number[]): number | null {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
}

/** Rows that have screen-time data (a day with usage access and some use). */
function withScreen(rows: readonly SummaryRow[]): SummaryRow[] {
  return rows.filter((r) => r.screenTimeMs > 0);
}

/** "14% less than last week": negative = less. null when there's nothing to compare. */
export function percentChange(now: number | null, before: number | null): number | null {
  if (now === null || before === null || before <= 0) return null;
  return Math.round(((now - before) / before) * 100);
}

/** Average daily screen time over the days in `days` that have data. */
export function avgScreen(rows: readonly SummaryRow[], days: readonly DayKey[]): number | null {
  const set = new Set(days);
  return average(withScreen(rows.filter((r) => set.has(r.date))).map((r) => r.screenTimeMs));
}

export function avgPickups(rows: readonly SummaryRow[], days: readonly DayKey[]): number | null {
  const set = new Set(days);
  return average(
    rows.filter((r) => set.has(r.date) && r.pickups !== null).map((r) => r.pickups as number),
  );
}

/** The first 7 days with data: the baseline for "time back". */
export function firstWeekAverage(rows: readonly SummaryRow[]): number | null {
  const sorted = withScreen([...rows].sort((a, b) => a.date.localeCompare(b.date)));
  return average(sorted.slice(0, 7).map((r) => r.screenTimeMs));
}

/** Time back = Σ max(0, firstWeekAvg − day) over the period's days after the first week. */
export function timeBackMs(rows: readonly SummaryRow[], days: readonly DayKey[]): number {
  const base = firstWeekAverage(rows);
  if (base === null) return 0;
  const sorted = withScreen([...rows].sort((a, b) => a.date.localeCompare(b.date)));
  const firstWeek = new Set(sorted.slice(0, 7).map((r) => r.date));
  const set = new Set(days);
  return sorted
    .filter((r) => set.has(r.date) && !firstWeek.has(r.date))
    .reduce((s, r) => s + Math.max(0, base - r.screenTimeMs), 0);
}

export function sumDetours(rows: readonly SummaryRow[], days: readonly DayKey[]): number {
  const set = new Set(days);
  return rows.filter((r) => set.has(r.date)).reduce((s, r) => s + r.detours, 0);
}

/** Bars for the chart: blocked (red) and everything else, in minutes, one per day. */
export function bars(rows: readonly SummaryRow[], days: readonly DayKey[]) {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  return days.map((d) => {
    const r = byDate.get(d);
    const blocked = (r?.blockedTimeMs ?? 0) / 60_000;
    const total = (r?.screenTimeMs ?? 0) / 60_000;
    return { date: d, blocked, other: Math.max(0, total - blocked) };
  });
}

/** Days with any data so far: "Your first week fills in as you go" while < 2. */
export function daysWithData(rows: readonly SummaryRow[]): number {
  return rows.filter((r) => r.screenTimeMs > 0 || r.gamesPlayed > 0 || r.detours > 0).length;
}
