import { flashMs, flashStars, flashTrials, FLASH_TRIALS, WELL } from '../logic';

describe('Flash count', () => {
  it('places every dot without overlaps and offers the right count, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const trials = flashTrials(seed);
      expect(trials).toHaveLength(FLASH_TRIALS);
      for (const tr of trials) {
        const n = tr.dots.length;
        expect(n).toBeGreaterThanOrEqual(3);
        expect(n).toBeLessThanOrEqual(9);
        expect(tr.options).toContain(n);
        expect(new Set(tr.options).size).toBe(4);
        expect(Math.min(...tr.options)).toBeGreaterThanOrEqual(1);
        for (let a = 0; a < n; a++) {
          const p = tr.dots[a]!;
          expect(p.x * WELL.w).toBeGreaterThanOrEqual(WELL.margin);
          expect(p.y * WELL.h).toBeLessThanOrEqual(WELL.h - WELL.margin);
          for (let b = a + 1; b < n; b++) {
            const q = tr.dots[b]!;
            expect(Math.hypot((p.x - q.x) * WELL.w, (p.y - q.y) * WELL.h)).toBeGreaterThan(
              WELL.gap,
            );
          }
        }
      }
    }
  });

  it('ramps the count and shortens the flash', () => {
    const counts = flashTrials(3).map((t) => t.dots.length);
    expect(counts[7]!).toBeGreaterThan(counts[0]!);
    expect(flashMs(1)).toBe(850);
    expect(flashMs(8)).toBe(500);
  });

  it('keeps the prototype top star rule', () => {
    expect(flashStars(7)).toBe(3);
    expect(flashStars(5)).toBe(2);
    expect(flashStars(2)).toBe(1);
  });
});
