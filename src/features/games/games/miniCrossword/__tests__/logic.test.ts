import pack from '../content.json';
import {
  crossStars,
  isRightLetter,
  keysFor,
  rowFull,
  targetCell,
  CELL_NUMS,
  CROSS_KEYS,
  type Crossword,
} from '../logic';

const grid: Crossword = {
  id: 't',
  rows: ['sad', 'age', 'tow'],
  across: ['a', 'b', 'c'],
  down: ['d', 'e', 'f'],
};

describe('crossStars', () => {
  it('gives 3 for a clean solve, 2 with wrong letters, 1 when unfinished', () => {
    expect(crossStars(0, true)).toBe(3);
    expect(crossStars(2, true)).toBe(2);
    expect(crossStars(0, false)).toBe(1);
  });
});

describe('keysFor', () => {
  it('has nine different keys including every grid letter', () => {
    for (let seed = 0; seed < 200; seed++) {
      const keys = keysFor(grid.rows, seed);
      expect(keys).toHaveLength(CROSS_KEYS);
      expect(new Set(keys).size).toBe(CROSS_KEYS);
      for (const ch of grid.rows.join('')) expect(keys).toContain(ch);
    }
  });

  it('is seeded', () => {
    expect(keysFor(grid.rows, 7)).toEqual(keysFor(grid.rows, 7));
  });

  it('fits every grid in the pack', () => {
    for (const g of pack.items as Crossword[]) {
      const keys = keysFor(g.rows, 1);
      expect(new Set(keys).size).toBe(CROSS_KEYS);
      for (const ch of g.rows.join('')) expect(keys).toContain(ch);
    }
  });
});

describe('targetCell', () => {
  const empty = Array<string>(9).fill('');

  it('fills the active row left to right', () => {
    expect(targetCell(empty, 1, null)).toBe(3);
    const cells = [...empty];
    cells[3] = 'a';
    expect(targetCell(cells, 1, null)).toBe(4);
  });

  it('uses the cursor when it is an empty square of the row', () => {
    expect(targetCell(empty, 1, 5)).toBe(5);
    expect(targetCell(empty, 1, 0)).toBe(3);
    const cells = [...empty];
    cells[5] = 'e';
    expect(targetCell(cells, 1, 5)).toBe(3);
  });

  it('is -1 for a full row', () => {
    const cells = ['s', 'a', 'd', ...empty.slice(3)];
    expect(targetCell(cells, 0, null)).toBe(-1);
    expect(rowFull(cells, 0)).toBe(true);
    expect(rowFull(cells, 1)).toBe(false);
  });
});

describe('isRightLetter', () => {
  it('checks the square against the grid', () => {
    expect(isRightLetter(grid, 0, 's')).toBe(true);
    expect(isRightLetter(grid, 4, 'G')).toBe(true);
    expect(isRightLetter(grid, 8, 'x')).toBe(false);
  });
});

describe('CELL_NUMS', () => {
  it('numbers 1-3 across the top and 4, 5 down the left', () => {
    expect(CELL_NUMS.slice(0, 3)).toEqual([1, 2, 3]);
    expect([CELL_NUMS[3], CELL_NUMS[6]]).toEqual([4, 5]);
  });
});
