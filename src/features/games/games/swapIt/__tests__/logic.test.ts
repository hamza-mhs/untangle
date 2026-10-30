import {
  applySwaps,
  STAR_CARD,
  swapMs,
  swapRounds,
  swapStars,
  SWAP_CARDS,
  SWAP_ROUNDS,
} from '../logic';

describe('Swap it', () => {
  it('builds 5 rounds of 2 + r swaps between different slots, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const rounds = swapRounds(seed);
      expect(rounds).toHaveLength(SWAP_ROUNDS);
      let slots = [0, 1, 2];
      rounds.forEach((swaps, i) => {
        expect(swaps).toHaveLength(3 + i);
        for (const [a, b] of swaps) {
          expect(a).not.toBe(b);
          expect(a).toBeGreaterThanOrEqual(0);
          expect(b).toBeLessThan(SWAP_CARDS);
        }
        slots = applySwaps(slots, swaps);
        expect([...slots].sort()).toEqual([0, 1, 2]);
        expect(slots[STAR_CARD]).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it('is deterministic per seed', () => {
    expect(swapRounds(7)).toEqual(swapRounds(7));
  });

  it('speeds up but never under 240 ms', () => {
    expect(swapMs(1)).toBe(395);
    expect(swapMs(5)).toBe(240);
    expect(swapMs(9)).toBe(240);
  });

  it('keeps the prototype top star rule', () => {
    expect(swapStars(5, 0)).toBe(3);
    expect(swapStars(4, 1)).toBe(2);
    expect(swapStars(1, 4)).toBe(1);
  });
});
