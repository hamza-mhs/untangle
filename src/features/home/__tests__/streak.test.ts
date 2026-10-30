import { aboutMinutes, computeStreak, dayMeetsGoal, usualOf, weekDays } from '../streak';

const today = '2026-10-30';

describe('streak', () => {
  it('counts games and detours toward the goal', () => {
    expect(dayMeetsGoal({ games: 2, detours: 1 }, 3)).toBe(true);
    expect(dayMeetsGoal({ games: 2, detours: 0 }, 3)).toBe(false);
    expect(dayMeetsGoal(undefined, 1)).toBe(false);
  });

  it('runs back from today', () => {
    const byDay = {
      '2026-10-30': { games: 3, detours: 0 },
      '2026-10-29': { games: 1, detours: 2 },
      '2026-10-28': { games: 3, detours: 0 },
      '2026-10-26': { games: 3, detours: 0 },
    };
    expect(computeStreak(byDay, today, 3)).toBe(3);
  });

  it('an unfinished today does not break it until midnight', () => {
    const byDay = {
      '2026-10-29': { games: 3, detours: 0 },
      '2026-10-28': { games: 3, detours: 0 },
    };
    expect(computeStreak(byDay, today, 3)).toBe(2);
    expect(computeStreak(byDay, '2026-10-31', 3)).toBe(0);
  });

  it('crosses month ends', () => {
    const byDay = {
      '2026-11-01': { games: 1, detours: 0 },
      '2026-10-31': { games: 1, detours: 0 },
    };
    expect(computeStreak(byDay, '2026-11-01', 1)).toBe(2);
  });
});

describe('helpers', () => {
  it('week starts on Monday', () => {
    const w = weekDays('2026-10-30'); // a Friday
    expect(w[0]).toBe('2026-10-26');
    expect(w[6]).toBe('2026-11-01');
  });
  it('about N min', () => {
    expect(aboutMinutes([40, 45, 90])).toBe(3);
    expect(aboutMinutes([10])).toBe(1);
  });
  it('usual needs three days', () => {
    expect(usualOf([10, null, 20])).toBeNull();
    expect(usualOf([10, 20, 30, null])).toBe(20);
  });
});
