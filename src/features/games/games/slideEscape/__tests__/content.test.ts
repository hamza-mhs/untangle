import pack from '../content.json';
import { cellsOf, minSlideMoves, pieces, SLIDE_SIZE, type SlideBoard } from '../logic';

const boards = pack.items as SlideBoard[];

describe('Slide escape pack', () => {
  it('has unique ids and non-overlapping pieces inside the board', () => {
    expect(boards.length).toBeGreaterThanOrEqual(200);
    expect(new Set(boards.map((b) => b.id)).size).toBe(boards.length);
    for (const b of boards) {
      const cells = pieces(b.gem, b.blocks).flatMap(cellsOf);
      expect(cells.every(([r, c]) => r >= 0 && c >= 0 && r < SLIDE_SIZE && c < SLIDE_SIZE)).toBe(
        true,
      );
      expect(new Set(cells.map(([r, c]) => r * 10 + c)).size).toBe(cells.length);
    }
  });

  it('re-solves every board to its recorded minimum moves', () => {
    for (const b of boards) expect(minSlideMoves(b.gem, b.blocks)).toBe(b.minMoves);
  });
});
