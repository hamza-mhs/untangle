import { addDays, daysBetween, isoWeekKey } from '../time';

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
