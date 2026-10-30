import { popSchedule, redStars, TAP_COLS, TAP_ROWS } from '../logic';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 13);

describe("Don't tap red", () => {
  it('never puts two live shapes in one cell, for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const pops = popSchedule(s);
      expect(pops.length).toBeGreaterThan(30);
      for (const p of pops) {
        expect(p.cell).toBeGreaterThanOrEqual(0);
        expect(p.cell).toBeLessThan(TAP_COLS * TAP_ROWS);
        const clash = pops.filter(
          (q) => q !== p && q.cell === p.cell && q.at < p.at + p.ttl && p.at < q.at + q.ttl,
        );
        expect(clash).toHaveLength(0);
      }
      const red = pops.filter((p) => p.red).length / pops.length;
      expect(red).toBeGreaterThan(0.08);
      expect(red).toBeLessThan(0.5);
    }
  });
  it('stars', () => {
    expect([redStars(20, 0), redStars(20, 2), redStars(3, 0)]).toEqual([3, 2, 1]);
  });
});
