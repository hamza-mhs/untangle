import pack from '../content.json';
import { isLadder, shortestLadder, type Ladder } from '../logic';

const ladders = pack.items as Ladder[];
const dict = new Set(pack.dict);

describe('Word bridge pack', () => {
  it('has unique ids and 4-letter words', () => {
    expect(ladders.length).toBeGreaterThanOrEqual(200);
    expect(new Set(ladders.map((l) => l.id)).size).toBe(ladders.length);
    expect(pack.dict.every((w) => /^[a-z]{4}$/.test(w))).toBe(true);
  });

  it('re-solves every ladder: BFS shortest path is 3–5 steps and matches the stored route', () => {
    for (const l of ladders) {
      expect(isLadder(l.path, dict)).toBe(true);
      expect(l.path[0]).toBe(l.from);
      expect(l.path.at(-1)).toBe(l.to);
      const best = shortestLadder(l.from, l.to, dict)!;
      expect(best.length).toBe(l.path.length);
      expect(best.length - 1).toBeGreaterThanOrEqual(3);
      expect(best.length - 1).toBeLessThanOrEqual(5);
    }
  });

  it('gives a keyboard with every letter the route needs', () => {
    for (const l of ladders) {
      expect(l.keys.length).toBeGreaterThanOrEqual(7);
      for (let i = 1; i < l.path.length; i++)
        for (let p = 0; p < 4; p++)
          if (l.path[i]![p] !== l.path[i - 1]![p]) expect(l.keys).toContain(l.path[i]![p]);
    }
  });
});
