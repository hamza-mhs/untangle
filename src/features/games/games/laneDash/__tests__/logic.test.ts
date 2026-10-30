import { laneSchedule, laneStars } from '../logic';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 13);

describe('Lane dash', () => {
  it('always leaves a free lane, for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const items = laneSchedule(s);
      const rows = new Map<number, Set<number>>();
      for (const it of items.filter((i) => i.kind === 'block')) {
        const set = rows.get(it.at) ?? new Set();
        set.add(it.lane);
        rows.set(it.at, set);
      }
      for (const lanes of rows.values()) expect(lanes.size).toBeLessThan(3);
      const gemsOnBlocks = items.filter((g) => g.kind === 'gem' && rows.get(g.at)?.has(g.lane));
      expect(gemsOnBlocks).toHaveLength(0);
    }
  });
  it('stars', () => {
    expect([laneStars(0), laneStars(2), laneStars(5)]).toEqual([3, 2, 1]);
  });
});
