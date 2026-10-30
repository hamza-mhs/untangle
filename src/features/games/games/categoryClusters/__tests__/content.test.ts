import pack from '../content.json';

type Puzzle = {
  id: string;
  groups: { name: string; words: string[] }[];
  herring: { word: string; alsoFits: string };
};
const puzzles = pack.items as Puzzle[];

describe('Category clusters pack', () => {
  it('is marked unreviewed until the owner checks it', () => {
    expect(pack.reviewed).toBe(false);
  });

  it('has at least 120 puzzles with sequential ids', () => {
    expect(puzzles.length).toBeGreaterThanOrEqual(120);
    puzzles.forEach((p, i) => expect(p.id).toBe(`cc-${String(i + 1).padStart(4, '0')}`));
  });

  it('every puzzle is 12 different words in 3 groups of 4, with one red herring', () => {
    for (const p of puzzles) {
      expect(p.groups).toHaveLength(3);
      const words = p.groups.flatMap((g) => g.words);
      expect(words).toHaveLength(12);
      expect(new Set(words).size).toBe(12);
      for (const g of p.groups) {
        expect(g.words).toHaveLength(4);
        expect(g.name.length).toBeLessThanOrEqual(18);
      }
      for (const w of words) expect(w).toMatch(/^[a-z]{3,10}$/);
      const home = p.groups.find((g) => g.words.includes(p.herring.word));
      expect(home).toBeDefined();
      expect(p.groups.some((g) => g.name === p.herring.alsoFits && g !== home)).toBe(true);
    }
  });
});
