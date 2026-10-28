import { parseClock } from '@/lib/time';

import type { Schedule } from './model';

/** Is `at` inside the schedule window? Windows that cross midnight belong to their start day. */
export function isScheduleActive(s: Schedule, at: Date): boolean {
  const minutes = at.getHours() * 60 + at.getMinutes();
  const start = parseClock(s.start);
  const end = parseClock(s.end);
  const today = at.getDay();
  const yesterday = (today + 6) % 7;

  if (end > start) {
    return s.days.includes(today as Schedule['days'][number]) && minutes >= start && minutes < end;
  }
  // Overnight window, e.g. 22:00–07:00.
  return (
    (s.days.includes(today as Schedule['days'][number]) && minutes >= start) ||
    (s.days.includes(yesterday as Schedule['days'][number]) && minutes < end)
  );
}
