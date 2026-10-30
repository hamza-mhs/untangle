import { dealPairs, pairsStars } from '../logic';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 13);

describe('Card pairs', () => {
  it('deals six pairs for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const deck = dealPairs(s);
      expect(deck).toHaveLength(12);
      const counts = new Map<string, number>();
      for (const f of deck) counts.set(f, (counts.get(f) ?? 0) + 1);
      expect([...counts.values()].every((n) => n === 2)).toBe(true);
    }
  });
  it('stars', () => {
    expect([pairsStars(6, 8), pairsStars(6, 12), pairsStars(4, 6)]).toEqual([3, 2, 1]);
  });
});
