import { forgePoints, forgeStars, fromRack, judgeWord, type Rack } from '../logic';

const rack: Rack = { id: 'lf-test', letters: 'planets', words: ['ant', 'plan', 'planet', 'slant'] };

describe('fromRack', () => {
  it('uses each tile at most once', () => {
    expect(fromRack('plan', 'planets')).toBe(true);
    expect(fromRack('apple', 'planets')).toBe(false);
    expect(fromRack('zzz', 'planets')).toBe(false);
  });
});

describe('judgeWord', () => {
  it('needs three letters first', () => {
    expect(judgeWord('an', rack, [])).toBe('short');
    expect(judgeWord('', rack, [])).toBe('short');
  });

  it('only accepts words in the rack list', () => {
    expect(judgeWord('plan', rack, [])).toBe('ok');
    expect(judgeWord('PLANET', rack, [])).toBe('ok');
    expect(judgeWord('nap', rack, [])).toBe('unknown');
  });

  it('refuses a word already forged', () => {
    expect(judgeWord('slant', rack, ['slant'])).toBe('repeat');
  });
});

describe('scoring', () => {
  it('pays longer words more', () => {
    expect(forgePoints('ant')).toBe(9);
    expect(forgePoints('planet')).toBe(36);
    expect(forgePoints('planet')).toBeGreaterThan(forgePoints('plan'));
  });

  it('stars: 6+ letters 3, any word 2, none 1', () => {
    expect(forgeStars(6, 1)).toBe(3);
    expect(forgeStars(4, 3)).toBe(2);
    expect(forgeStars(0, 0)).toBe(1);
  });
});
