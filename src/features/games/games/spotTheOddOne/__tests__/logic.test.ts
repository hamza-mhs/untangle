import { mixWhite, oddBoards, oddDiff, oddStars, ODD_ROUNDS, ODD_TILES } from '../logic';

describe('Spot the odd one', () => {
  it('always has exactly one odd tile on a 4×4 board, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const boards = oddBoards(seed);
      expect(boards).toHaveLength(ODD_ROUNDS);
      boards.forEach((b, i) => {
        expect(b.odd).toBeGreaterThanOrEqual(0);
        expect(b.odd).toBeLessThan(ODD_TILES);
        expect(b.kind).toBe((i + 1) % 3 === 0 ? 'flip' : 'shade');
        expect(b.diff).toBeGreaterThanOrEqual(8);
      });
    }
  });

  it('gets subtler each round', () => {
    expect(oddDiff(1)).toBe(27);
    expect(oddDiff(7)).toBe(9);
    expect(oddDiff(8)).toBe(8);
  });

  it('mixes toward white like CSS color-mix', () => {
    expect(mixWhite('#000000', 50)).toBe('#808080');
    expect(mixWhite('#FF3D8E', 0)).toBe('#ff3d8e');
    expect(mixWhite('#22A6FF', 100)).toBe('#ffffff');
  });

  it('keeps the prototype top star rule', () => {
    expect(oddStars(8)).toBe(3);
    expect(oddStars(5)).toBe(2);
    expect(oddStars(1)).toBe(1);
  });
});
