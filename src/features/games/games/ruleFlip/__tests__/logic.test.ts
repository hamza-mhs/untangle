import { conflicts, ruleAt } from '../../../kit/sortRules';
import { flipPieces, flipPoints, flipStars, FLIP_AT, FLIP_PIECES } from '../logic';

describe('Rule flip', () => {
  it('deals 16 pieces with a trap after both flips, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const ps = flipPieces(seed);
      expect(ps).toHaveLength(FLIP_PIECES);
      for (const f of FLIP_AT) expect(conflicts(ps[f]!)).toBe(true);
    }
  });

  it('flips colour → shape → colour', () => {
    expect([0, 6, 12].map((i) => ruleAt(i, FLIP_AT))).toEqual(['colour', 'shape', 'colour']);
  });

  it('scores streaks and keeps the prototype top star rule', () => {
    expect(flipPoints(1)).toBe(10);
    expect(flipPoints(5)).toBe(18);
    expect(flipStars(14)).toBe(3);
    expect(flipStars(11)).toBe(2);
    expect(flipStars(3)).toBe(1);
  });
});
