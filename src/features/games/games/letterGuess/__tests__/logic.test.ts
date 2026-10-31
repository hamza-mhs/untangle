import pack from '../content.json';
import { guess, isSolved, lgStars, rackFor, wellLetters, LG_RACK, type LgItem } from '../logic';

const items = pack.items as LgItem[];

describe('Letter guess rack', () => {
  it('holds every letter of the word, no duplicates, 10 keys, sorted (every pack word)', () => {
    items.forEach((it, i) => {
      const rack = rackFor(it.word, i * 7919 + 1);
      expect(rack).toHaveLength(LG_RACK);
      expect(new Set(rack).size).toBe(rack.length);
      for (const c of it.word) expect(rack).toContain(c);
      expect(rack).toEqual([...rack].sort());
      expect(rack.every((c) => /^[a-z]$/.test(c))).toBe(true);
    });
  });

  it('is the same for the same seed and varies the distractors across seeds', () => {
    expect(rackFor('calm', 42)).toEqual(rackFor('calm', 42));
    const racks = new Set(Array.from({ length: 50 }, (_, s) => rackFor('calm', s).join('')));
    expect(racks.size).toBeGreaterThan(1);
  });

  it('copes with repeated letters (one key per letter)', () => {
    const rack = rackFor('tree', 3);
    expect(rack.filter((c) => c === 'e')).toHaveLength(1);
    expect(rack).toHaveLength(LG_RACK);
  });
});

describe('Letter guess rules', () => {
  it('hits letters in the word, misses others, ignores repeats', () => {
    const tried = new Set<string>();
    expect(guess('moon', tried, 'o')).toBe('hit');
    expect(guess('moon', tried, 'z')).toBe('miss');
    tried.add('o');
    expect(guess('moon', tried, 'o')).toBe('none');
  });

  it('stamps a guessed letter into every matching well', () => {
    expect(wellLetters('moon', new Set(['o']))).toEqual(['', 'o', 'o', '']);
    expect(wellLetters('moon', new Set())).toEqual(['', '', '', '']);
  });

  it('is solved once every letter is found, whatever else was tried', () => {
    expect(isSolved('moon', new Set(['m', 'o']))).toBe(false);
    expect(isSolved('moon', new Set(['m', 'o', 'n', 'x']))).toBe(true);
  });

  it('gives 3 stars up to two misses, 2 above, 1 when nothing was found', () => {
    expect(lgStars(2, 0)).toBe(3);
    expect(lgStars(1, 2)).toBe(3);
    expect(lgStars(2, 3)).toBe(2);
    expect(lgStars(0, 0)).toBe(1);
    expect(lgStars(0, 9)).toBe(1);
  });
});
