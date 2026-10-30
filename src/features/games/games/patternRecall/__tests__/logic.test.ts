import { PADS, patternLength, patternStars, patternStream, PATTERN_ROUNDS } from '../logic';

describe('Pattern recall', () => {
  it('makes patterns of round + 2 pads on the 3×3 grid, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const next = patternStream(seed);
      for (let r = 1; r <= PATTERN_ROUNDS; r++) {
        const p = next(r);
        expect(p).toHaveLength(patternLength(r));
        expect(p.every((i) => i >= 0 && i < PADS.length)).toBe(true);
      }
    }
  });

  it('is deterministic per seed, and retries get a new pattern', () => {
    const a = patternStream(5);
    const b = patternStream(5);
    expect(a(1)).toEqual(b(1));
    expect(a(3)).toEqual(b(3));
    const c = patternStream(9);
    const first = c(5);
    expect(c(5)).not.toEqual(first);
  });

  it('keeps the prototype top star rule', () => {
    expect(patternStars(5)).toBe(3);
    expect(patternStars(3)).toBe(2);
    expect(patternStars(1)).toBe(1);
  });
});
