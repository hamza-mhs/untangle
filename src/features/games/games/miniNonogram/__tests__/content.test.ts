import pack from '../content.json';
import { clue, isLineSolvable, NONO_SIZE, type NonoBoard } from '../logic';

const boards = pack.items as NonoBoard[];

describe('Mini nonogram pack', () => {
  it('has 5×5 boards with unique ids', () => {
    expect(boards.length).toBeGreaterThanOrEqual(150);
    expect(new Set(boards.map((b) => b.id)).size).toBe(boards.length);
    for (const b of boards) {
      expect(b.rows).toHaveLength(NONO_SIZE);
      expect(b.rows.every((r) => /^[01]{5}$/.test(r))).toBe(true);
    }
  });

  it('re-solves every board by line logic alone', () => {
    for (const b of boards) expect(isLineSolvable(b)).toBe(true);
  });

  it('writes clues as run lengths', () => {
    expect(clue([0, 1, 1, 0, 1])).toEqual([2, 1]);
    expect(clue([0, 0, 0, 0, 0])).toEqual([0]);
  });
});
