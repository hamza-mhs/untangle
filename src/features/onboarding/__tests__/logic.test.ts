import {
  appNamesSummary,
  daysPerYear,
  fiveYearLine,
  goalCutMinutes,
  hoursBack,
  NOT_SURE_HOURS,
  SCROLL_OPTIONS,
  signsAnswered,
  toggleSign,
  yearLines,
} from '../logic';

describe('daysPerYear', () => {
  it('turns daily hours into full 24-hour days a year', () => {
    expect(daysPerYear(2.5)).toBe(38);
    expect(daysPerYear(0.5)).toBe(8);
    expect(daysPerYear(NOT_SURE_HOURS)).toBe(40);
    expect(daysPerYear(4.5)).toBe(68);
  });
  it('covers every scroll answer', () => {
    expect(SCROLL_OPTIONS.map((o) => daysPerYear(o.value))).toEqual([8, 23, 38, 53, 68, 40]);
  });
});

describe('fiveYearLine', () => {
  it('multiplies by five and adds five years to the age', () => {
    expect(fiveYearLine(2.5, 21)).toEqual({ days: 190, age: 26 });
    expect(fiveYearLine(0.5, 60)).toEqual({ days: 40, age: 65 });
  });
});

describe('hoursBack', () => {
  it('uses a 30-minute cut from one hour a day', () => {
    expect(goalCutMinutes(1)).toBe(30);
    expect(goalCutMinutes(2.5)).toBe(30);
    expect(hoursBack(2.5)).toBe(183);
  });
  it('uses a 15-minute cut under an hour', () => {
    expect(goalCutMinutes(0.5)).toBe(15);
    expect(hoursBack(0.5)).toBe(91);
  });
});

describe('yearLines', () => {
  it('starts at zero, ends at the yearly totals', () => {
    const { now, goal } = yearLines(2.5);
    expect(now).toHaveLength(13);
    expect(now[0]).toBe(0);
    expect(now[12]).toBeCloseTo(2.5 * 365);
    expect(goal[12]).toBeCloseTo(2 * 365);
  });
  it('never goes negative', () => {
    expect(Math.min(...yearLines(0.1).goal)).toBe(0);
  });
});

describe('toggleSign', () => {
  const empty = { signs: [], none: false };
  it('adds and removes signs in list order', () => {
    const a = toggleSign(toggleSign(empty, 'reading'), 'work');
    expect(a).toEqual({ signs: ['work', 'reading'], none: false });
    expect(toggleSign(a, 'work')).toEqual({ signs: ['reading'], none: false });
  });
  it('"None of these" clears the others', () => {
    const a = toggleSign(toggleSign(empty, 'work'), 'none');
    expect(a).toEqual({ signs: [], none: true });
  });
  it('any sign clears "None of these"', () => {
    const a = toggleSign(toggleSign(empty, 'none'), 'foggy');
    expect(a).toEqual({ signs: ['foggy'], none: false });
  });
  it('tapping None again unpicks it', () => {
    expect(toggleSign({ signs: [], none: true }, 'none')).toEqual(empty);
  });
  it('needs at least one pick to continue', () => {
    expect(signsAnswered(empty)).toBe(false);
    expect(signsAnswered({ signs: [], none: true })).toBe(true);
    expect(signsAnswered({ signs: ['work'], none: false })).toBe(true);
  });
});

describe('appNamesSummary', () => {
  it('shows up to three names', () => {
    expect(appNamesSummary(['A'])).toEqual({ shown: ['A'], more: 0 });
    expect(appNamesSummary(['A', 'B', 'C'])).toEqual({ shown: ['A', 'B', 'C'], more: 0 });
  });
  it('shows two and a count from four', () => {
    expect(appNamesSummary(['A', 'B', 'C', 'D'])).toEqual({ shown: ['A', 'B'], more: 2 });
  });
});
