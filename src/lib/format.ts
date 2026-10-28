import { t } from '@/i18n';

/**
 * Dates, times and durations through Intl and i18n (CODE_STANDARDS › Copy). Prices never come
 * through here: they're the store's `priceString`.
 */

const clock = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const homeDate = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
});
const longDate = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const weekdayNarrow = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });

/** "10:50" (24-hour where the locale uses it). */
export function formatClock(at: number | Date): string {
  return clock.format(at);
}

/** 'HH:MM' rule time → localized clock string. */
export function formatRuleTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return clock.format(new Date(2000, 0, 1, h, m));
}

/** "Thursday 22 Oct". */
export function formatHomeDate(at: number | Date): string {
  return homeDate.format(at);
}

/** "22 Oct 2027". */
export function formatLongDate(at: number | Date): string {
  return longDate.format(at);
}

/** "Tue". */
export function formatWeekday(at: number | Date): string {
  return weekday.format(at);
}

/** "M" for weekday circles; `day` is 0 = Sunday. */
export function formatWeekdayInitial(day: number): string {
  // 2023-01-01 was a Sunday.
  return weekdayNarrow.format(new Date(2023, 0, 1 + day));
}

/** "1h 48m", "38m", "2h". */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return t('format.minutes', { m });
  if (m === 0) return t('format.hours', { h });
  return t('format.hoursMinutes', { h, m });
}

/** "−32m" / "+24%": typographic minus, explicit plus. */
export function formatSigned(value: number, unit: '' | '%' | 'm' = ''): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const abs = Math.abs(value);
  return `${sign}${unit === 'm' ? formatDuration(abs) : abs}${unit === '%' ? '%' : ''}`;
}
