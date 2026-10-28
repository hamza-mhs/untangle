import type { ShieldEvent, UsageSummary } from '@/services/blocking';

/**
 * FReceipt · the day as a till receipt, pure. Screen-time lines only appear when we have the
 * numbers (Android UsageStatsManager); on iOS they'd need the DeviceActivityReport view, so the
 * receipt there shows our own counts only (pack 2 EDGE_CASES: no screen-time data).
 */
export const WORKDAY_MINUTES = 8 * 60;
export const EVENING_HOUR = 18;

export type ReceiptData = {
  at: number;
  screenTimeMinutes: number | null;
  opens: number;
  resisted: number;
  offlineMinutes: number;
  weekMinutes: number | null;
  lastWeekMinutes: number | null;
  challengesDone: number;
  challengesTotal: number;
  pointsToday: number;
};

export function buildReceipt(input: {
  at: number;
  today: UsageSummary | null;
  week: readonly (UsageSummary | null)[];
  lastWeek: readonly (UsageSummary | null)[];
  events: readonly ShieldEvent[];
  focusMinutesToday: number;
  challengesDone: number;
  challengesTotal: number;
  pointsToday: number;
}): ReceiptData {
  const sum = (days: readonly (UsageSummary | null)[]) =>
    days.some((d) => d !== null) ? days.reduce((n, d) => n + (d?.screenTimeMinutes ?? 0), 0) : null;
  return {
    at: input.at,
    screenTimeMinutes: input.today?.screenTimeMinutes ?? null,
    opens: input.events.length,
    resisted: input.events.filter((e) => e.outcome === 'closed').length,
    offlineMinutes: input.focusMinutesToday,
    weekMinutes: sum(input.week),
    lastWeekMinutes: sum(input.lastWeek),
    challengesDone: input.challengesDone,
    challengesTotal: input.challengesTotal,
    pointsToday: input.pointsToday,
  };
}

/** "1H 52M" / "48M". */
export function receiptDuration(minutes: number): string {
  const m = Math.abs(Math.round(minutes));
  const h = Math.floor(m / 60);
  const rest = String(m % 60).padStart(h > 0 ? 2 : 1, '0');
  return `${minutes < 0 ? '−' : ''}${h > 0 ? `${h}H ${rest}M` : `${rest}M`}`;
}

export function workdays(minutes: number): string {
  return (minutes / WORKDAY_MINUTES).toFixed(1);
}

/** Barcode bar widths (1–3) from a seed, so each day's receipt has its own. */
export function barcode(seed: number, count = 48): number[] {
  let x = seed || 1;
  return Array.from({ length: count }, () => {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return 1 + (x % 3);
  });
}
