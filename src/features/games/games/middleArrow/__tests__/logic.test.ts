import { arrowStars, arrowTrials, averageMs } from '../logic';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 13);

describe('Middle arrow', () => {
  it('half congruent for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const tr = arrowTrials(s);
      expect(tr).toHaveLength(20);
      expect(tr.filter((x) => x.flank === x.middle)).toHaveLength(10);
    }
  });
  it('average and stars', () => {
    expect(averageMs([400, 500, 600])).toBe(500);
    expect(averageMs([])).toBe(0);
    expect([arrowStars(15), arrowStars(10), arrowStars(3)]).toEqual([3, 2, 1]);
  });
});
