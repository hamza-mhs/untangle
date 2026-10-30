import { totalPoints, totalStars, totalTrials, TOTAL_TRIALS } from '../logic';

describe('Bigger total', () => {
  it('never ties and always names the bigger stack, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const tr = totalTrials(seed);
      expect(tr).toHaveLength(TOTAL_TRIALS);
      for (const q of tr) {
        const [a, b] = q.stacks;
        expect(a).toHaveLength(3);
        expect([...a, ...b].every((v) => v >= 1 && v <= 9)).toBe(true);
        const sa = a.reduce((x, y) => x + y, 0);
        const sb = b.reduce((x, y) => x + y, 0);
        expect(q.sums).toEqual([sa, sb]);
        expect(sa).not.toBe(sb);
        expect(q.bigger).toBe(sa > sb ? 0 : 1);
      }
    }
  });

  it('scores streaks and keeps the prototype top star rule', () => {
    expect(totalPoints(3)).toBe(13);
    expect(totalStars(11)).toBe(3);
    expect(totalStars(9)).toBe(2);
    expect(totalStars(2)).toBe(1);
  });
});
