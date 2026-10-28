/** Local-calendar helpers. All "day" logic uses the device's local midnight. */

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** 'YYYY-MM-DD' for the local calendar day containing `t`. */
export type DayKey = string;

export function dayKey(t: number | Date = Date.now()): DayKey {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Local midnight (epoch ms) of a day key. */
export function dayStart(key: DayKey): number {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).getTime();
}

export function addDays(key: DayKey, n: number): DayKey {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return dayKey(new Date(y, m - 1, d + n));
}

/** Whole calendar days from `a` to `b` (b − a). DST-safe because it goes through local dates. */
export function daysBetween(a: DayKey, b: DayKey): number {
  const [ay, am, ad] = a.split('-').map(Number) as [number, number, number];
  const [by, bm, bd] = b.split('-').map(Number) as [number, number, number];
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / DAY);
}

/** ISO-8601 week key, e.g. '2026-W43'. Weeks start Monday. Used for weekly emergency passes. */
export function isoWeekKey(t: number | Date = Date.now()): string {
  const d = new Date(t);
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dow = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dow);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart) / DAY + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** 'HH:MM' → minutes after midnight. */
export function parseClock(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return h * 60 + m;
}
