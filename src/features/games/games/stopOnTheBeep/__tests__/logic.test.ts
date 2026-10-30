import { beepStars, beepTrials, BEEP_STOPS, BEEP_TRIALS } from '../logic';

describe('Stop on the beep', () => {
  it('has 4 surprise stops, never first and never back to back, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const tr = beepTrials(seed);
      expect(tr).toHaveLength(BEEP_TRIALS);
      expect(tr.filter((x) => x.stop)).toHaveLength(BEEP_STOPS);
      expect(tr[0]!.stop).toBe(false);
      for (let i = 1; i < tr.length; i++) expect(tr[i]!.stop && tr[i - 1]!.stop).toBe(false);
      for (const x of tr) {
        expect(x.delayMs).toBeGreaterThanOrEqual(120);
        expect(x.delayMs).toBeLessThanOrEqual(220);
      }
    }
  });

  it('keeps the prototype top star rule (no slips = 3)', () => {
    expect(beepStars(12, 4, 0)).toBe(3);
    expect(beepStars(10, 3, 1)).toBe(2);
    expect(beepStars(3, 1, 3)).toBe(1);
  });
});
