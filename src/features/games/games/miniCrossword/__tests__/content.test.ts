import pack from '../content.json';
import { columns, CROSS_SIZE, type Crossword } from '../logic';

const grids = pack.items as Crossword[];

describe('Mini crossword pack', () => {
  it('is marked unreviewed until the owner checks the clues', () => {
    expect(pack.reviewed).toBe(false);
  });

  it('has at least 100 grids with unique ids', () => {
    expect(grids.length).toBeGreaterThanOrEqual(100);
    expect(new Set(grids.map((g) => g.id)).size).toBe(grids.length);
  });

  it('every grid has six different words and a clue for each', () => {
    for (const g of grids) {
      expect(g.rows).toHaveLength(CROSS_SIZE);
      const all = [...g.rows, ...columns(g.rows)];
      expect(new Set(all).size).toBe(6);
      expect(g.across).toHaveLength(3);
      expect(g.down).toHaveLength(3);
      [...g.across, ...g.down].forEach((c, i) => {
        expect(c.length).toBeGreaterThan(0);
        expect(c.toLowerCase()).not.toContain(all[i]);
      });
    }
  });
});
