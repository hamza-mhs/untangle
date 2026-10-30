import { linePos, timeError, timePoints, timeStars } from '../logic';

describe('Time it right', () => {
  it('measures the error against 5 seconds', () => {
    expect(timeError(5000)).toBe(0);
    expect(timeError(5310)).toBeCloseTo(0.31);
    expect(timeError(4820)).toBeCloseTo(-0.18);
  });

  it('scores like the prototype and never below 5', () => {
    expect(timePoints(0)).toBe(100);
    expect(timePoints(0.1)).toBe(70);
    expect(timePoints(-2)).toBe(5);
  });

  it('places times on the 3–7 s line', () => {
    expect(linePos(5)).toBe(0.5);
    expect(linePos(2)).toBe(0);
    expect(linePos(9)).toBe(1);
  });

  it('keeps the prototype top star rule', () => {
    expect(timeStars(0.08)).toBe(3);
    expect(timeStars(0.2)).toBe(2);
    expect(timeStars(0.6)).toBe(1);
  });

  it('is monotonic in the error for every 10 ms tap, 0–8 s', () => {
    let last = Infinity;
    for (let ms = 5000; ms <= 8000; ms += 10) {
      const p = timePoints(timeError(ms));
      expect(p).toBeLessThanOrEqual(last);
      last = p;
    }
  });
});
