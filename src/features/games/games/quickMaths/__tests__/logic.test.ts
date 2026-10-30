import { mathsPoints, mathsStars, mathsTrials, MATHS_TRIALS } from '../logic';

describe('Quick maths', () => {
  it('always has the answer among 4 distinct options, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const tr = mathsTrials(seed);
      expect(tr).toHaveLength(MATHS_TRIALS);
      for (const q of tr) {
        const want = q.op === '+' ? q.a + q.b : q.op === '−' ? q.a - q.b : q.a * q.b;
        expect(q.answer).toBe(want);
        expect(q.answer).toBeGreaterThan(0);
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.answer);
      }
    }
  });

  it('scores streaks and keeps the prototype star rule', () => {
    expect(mathsPoints(1)).toBe(10);
    expect(mathsPoints(3)).toBe(20);
    expect(mathsStars(9)).toBe(3);
    expect(mathsStars(6)).toBe(2);
    expect(mathsStars(5)).toBe(1);
  });
});
