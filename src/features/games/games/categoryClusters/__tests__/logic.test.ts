import pack from '../content.json';
import {
  ccStars,
  checkPick,
  dealWords,
  groupOf,
  herringTrap,
  pickedGroup,
  unsolved,
  type CcPuzzle,
} from '../logic';

const puzzles = pack.items as CcPuzzle[];
const P: CcPuzzle = {
  id: 'test',
  groups: [
    { name: 'Planets', words: ['mars', 'venus', 'saturn', 'earth'] },
    { name: 'Colours', words: ['teal', 'plum', 'amber', 'navy'] },
    { name: 'Fruit', words: ['mango', 'kiwi', 'banana', 'pear'] },
  ],
  herring: { word: 'plum', alsoFits: 'Fruit' },
};

describe('Category clusters rules', () => {
  it('finds a whole group in any order', () => {
    expect(checkPick(P, ['earth', 'mars', 'saturn', 'venus'])).toBe('group');
    expect(pickedGroup(P, ['earth', 'mars', 'saturn', 'venus'])).toBe(0);
    expect(pickedGroup(P, ['pear', 'kiwi', 'mango', 'banana'])).toBe(2);
  });

  it('says one away for three of a group, miss otherwise', () => {
    expect(checkPick(P, ['mango', 'kiwi', 'pear', 'plum'])).toBe('oneAway');
    expect(checkPick(P, ['mango', 'kiwi', 'teal', 'plum'])).toBe('miss');
    expect(checkPick(P, ['mango', 'teal', 'mars', 'plum'])).toBe('miss');
  });

  it('rejects picks that are not four different words', () => {
    expect(checkPick(P, ['mars', 'venus', 'saturn'])).toBe('miss');
    expect(checkPick(P, ['mars', 'mars', 'venus', 'saturn'])).toBe('miss');
    expect(checkPick(P, ['mars', 'venus', 'saturn', 'earth', 'teal'])).toBe('miss');
  });

  it('spots the red herring only when it is the odd one in its look-alike group', () => {
    expect(herringTrap(P, ['mango', 'kiwi', 'pear', 'plum'])).toBe('plum');
    // Three colours plus a fruit: one away, but not the trap.
    expect(herringTrap(P, ['teal', 'plum', 'amber', 'kiwi'])).toBeNull();
    expect(herringTrap(P, ['mango', 'kiwi', 'pear', 'mars'])).toBeNull();
    expect(herringTrap(P, ['mango', 'kiwi', 'pear', 'banana'])).toBeNull();
  });

  it('deals all 12 words, the same for the same seed', () => {
    const a = dealWords(P, 7);
    expect([...a].sort()).toEqual(P.groups.flatMap((g) => g.words).sort());
    expect(dealWords(P, 7)).toEqual(a);
    expect(groupOf(P, 'navy')).toBe(1);
    expect(groupOf(P, 'nope')).toBe(-1);
  });

  it('lists the groups still hidden', () => {
    expect(unsolved(P, [])).toEqual([0, 1, 2]);
    expect(unsolved(P, [2, 0])).toEqual([1]);
    expect(unsolved(P, [0, 1, 2])).toEqual([]);
  });

  it('keeps the prototype star rule, 1★ for an unfinished board', () => {
    expect(ccStars(3, 0)).toBe(3);
    expect(ccStars(3, 2)).toBe(2);
    expect(ccStars(2, 0)).toBe(1);
    expect(ccStars(0, 4)).toBe(1);
  });

  it('every pack puzzle: each group checks as a group and the herring trap fires', () => {
    for (const p of puzzles) {
      p.groups.forEach((g, i) => {
        expect(checkPick(p, g.words)).toBe('group');
        expect(pickedGroup(p, g.words)).toBe(i);
      });
      const look = p.groups.find((g) => g.name === p.herring.alsoFits)!;
      const pick = [...look.words.slice(0, 3), p.herring.word];
      expect(herringTrap(p, pick)).toBe(p.herring.word);
    }
  });
});
