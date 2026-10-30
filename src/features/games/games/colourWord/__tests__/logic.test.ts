import { colourStars, colourTrials, INKS } from '../logic';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 13);

describe('Colour word', () => {
  it('makes 14 valid, mostly incongruent trials for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const trials = colourTrials(s);
      expect(trials).toHaveLength(14);
      for (const tr of trials) {
        expect(INKS).toContain(tr.ink);
        expect(INKS).toContain(tr.word);
      }
      expect(trials.filter((tr) => tr.word !== tr.ink).length).toBeGreaterThanOrEqual(6);
    }
  });
  it('stars', () => {
    expect([colourStars(13), colourStars(9), colourStars(8)]).toEqual([3, 2, 1]);
  });
});
