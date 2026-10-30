import { echoIsMatch, echoSequence, ECHO_MATCHES } from '../logic';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 13);

describe('Echo', () => {
  it('has exactly 5 two-back matches for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const seq = echoSequence(s);
      expect(seq).toHaveLength(16);
      expect(seq.filter((_, i) => echoIsMatch(seq, i))).toHaveLength(ECHO_MATCHES);
      expect(echoIsMatch(seq, 0)).toBe(false);
      expect(echoIsMatch(seq, 1)).toBe(false);
    }
  });
});
