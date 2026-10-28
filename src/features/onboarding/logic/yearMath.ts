import type { ScreenTimeBucket } from '../types';

/**
 * OB06 / OB07 / OB14 numbers (SPEC §5). Pure functions: the screens only format them.
 */

/** Midpoint of each OB02 bucket, in hours a day. "Not sure" counts as the middle bucket. */
export const BUCKET_HOURS: Record<ScreenTimeBucket, number> = {
  lt2: 1.5,
  '2-4': 3,
  '4-6': 5,
  '6-8': 7,
  '8+': 9,
  unsure: 5,
};

const DAYS_PER_YEAR = 365;
const HOURS_PER_DAY = 24;

/** Days a year gained per hour a day saved: 365 / 24 ≈ 15.2. */
export const DAYS_PER_HOUR_SAVED = DAYS_PER_YEAR / HOURS_PER_DAY;

export function hoursPerDay(bucket: ScreenTimeBucket | null): number {
  return BUCKET_HOURS[bucket ?? 'unsure'];
}

/** OB06 hero: `round(hoursPerDay × 365 / 24)`. */
export function daysPerYear(hours: number): number {
  return Math.round((hours * DAYS_PER_YEAR) / HOURS_PER_DAY);
}

/**
 * OB06 body copy, scaled to the result (DECIDED 30 / 60): under 30 → "That's {n} days",
 * 30–59 → "more than a month", 60+ → "more than two months".
 */
export type YearBodyKey = 'days' | 'month' | 'twoMonths';
export const YEAR_MONTH_THRESHOLD = 30;
export const YEAR_TWO_MONTHS_THRESHOLD = 60;

export function yearBodyKey(days: number): YearBodyKey {
  if (days >= YEAR_TWO_MONTHS_THRESHOLD) return 'twoMonths';
  if (days >= YEAR_MONTH_THRESHOLD) return 'month';
  return 'days';
}

export type GoalSize = 'hour' | 'halfHour';

export type GoodNews = {
  /** The daily cut we suggest. */
  goal: GoalSize;
  /** Days a year back: 15.2 for an hour, 7.6 for half an hour (unrounded). */
  gain: number;
  /** OB06 number. */
  now: number;
  /** Days a year after the cut, rounded; always ≥ 1 so the bar never vanishes. */
  withUs: number;
  /** "With us" bar width as a fraction of "Now" (0 < ratio < 1). */
  ratio: number;
};

/** At or below this many days, an hour a day is too big an ask: offer 30 minutes instead. */
export const SMALL_YEAR_DAYS = 15;
const MIN_BAR_RATIO = 0.08;

/** OB07 reframe. Edge case: ≤ 15 days → 30 min a day (7.6 days), no zero/negative bar. */
export function goodNews(days: number): GoodNews {
  const goal: GoalSize = days <= SMALL_YEAR_DAYS ? 'halfHour' : 'hour';
  const gain = goal === 'hour' ? DAYS_PER_HOUR_SAVED : DAYS_PER_HOUR_SAVED / 2;
  const now = Math.max(days, 1);
  const withUs = Math.max(1, Math.round(now - gain));
  const ratio = Math.min(1 - MIN_BAR_RATIO, Math.max(MIN_BAR_RATIO, withUs / now));
  return { goal, gain, now, withUs, ratio };
}

/** "15" for an hour, "7.6" for half an hour. */
export function formatGain(gain: number): string {
  const rounded = Math.round(gain * 10) / 10;
  return gain >= 10 ? String(Math.round(gain)) : String(rounded);
}

/** "1.5", "5" — the hours figure in the OB06 formula card. */
export function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}
