import { spanMarks, spanStars, spanStream, SPAN_MAX, SPAN_START } from '../logic';

describe('Number span', () => {
  it('makes digit strings of the asked length, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const next = spanStream(seed);
      for (let len = SPAN_START; len <= SPAN_MAX; len++) {
        const d = next(len);
        expect(d).toHaveLength(len);
        expect(d.every((x) => Number.isInteger(x) && x >= 0 && x <= 9)).toBe(true);
      }
    }
  });

  it('marks each typed digit against the target', () => {
    expect(spanMarks([1, 2, 3, 4], [1, 2, 9, 4])).toEqual([true, true, false, true]);
    expect(spanMarks([1, 2, 3], [1, 2])).toEqual([true, true, false]);
  });

  it('keeps the prototype top star rule', () => {
    expect(spanStars(6)).toBe(3);
    expect(spanStars(5)).toBe(2);
    expect(spanStars(4)).toBe(1);
  });
});
