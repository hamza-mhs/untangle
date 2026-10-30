import { DIRS, OPPOSITE, oppPoints, oppStars, oppTrials, OPP_TRIALS } from '../logic';

describe('Opposite day', () => {
  it('never repeats a direction back to back, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const tr = oppTrials(seed);
      expect(tr).toHaveLength(OPP_TRIALS);
      for (let i = 0; i < tr.length; i++) {
        expect(DIRS).toContain(tr[i]);
        if (i > 0) expect(tr[i]).not.toBe(tr[i - 1]);
      }
    }
  });

  it('maps every arrow to its opposite', () => {
    for (const d of DIRS) {
      expect(OPPOSITE[OPPOSITE[d]]).toBe(d);
      expect(OPPOSITE[d]).not.toBe(d);
    }
  });

  it('scores streaks and keeps the prototype top star rule', () => {
    expect(oppPoints(1)).toBe(10);
    expect(oppPoints(4)).toBe(19);
    expect(oppStars(13)).toBe(3);
    expect(oppStars(10)).toBe(2);
    expect(oppStars(4)).toBe(1);
  });
});
