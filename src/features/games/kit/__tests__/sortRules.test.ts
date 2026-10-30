import { conflicts, ruleAt, sortPieces, sortSide } from '../sortRules';

describe('sort rules (Rule flip, Sort the stream)', () => {
  it('sends pieces by colour or by shape', () => {
    expect(sortSide({ colour: 'pink', shape: 'square' }, 'colour')).toBe(0);
    expect(sortSide({ colour: 'pink', shape: 'square' }, 'shape')).toBe(1);
    expect(conflicts({ colour: 'blue', shape: 'circle' })).toBe(true);
    expect(conflicts({ colour: 'blue', shape: 'square' })).toBe(false);
  });

  it('flips the rule at each flip index', () => {
    const flips = [6, 12];
    expect(ruleAt(0, flips)).toBe('colour');
    expect(ruleAt(6, flips)).toBe('shape');
    expect(ruleAt(11, flips)).toBe('shape');
    expect(ruleAt(12, flips)).toBe('colour');
  });

  it('makes the first piece after every flip a trap, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      for (const [n, flips] of [
        [16, [6, 12]],
        [20, [8]],
      ] as const) {
        const ps = sortPieces(seed, n, flips);
        expect(ps).toHaveLength(n);
        for (const f of flips) expect(conflicts(ps[f]!)).toBe(true);
      }
    }
  });
});
