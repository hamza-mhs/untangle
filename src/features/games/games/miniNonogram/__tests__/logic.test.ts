import pack from '../content.json';
import {
  colDone,
  grid,
  nonoMark,
  nonoSolved,
  nonoStars,
  nonoTap,
  rowDone,
  type NonoBoard,
  type NonoCell,
} from '../logic';

const heart = grid({ rows: ['01010', '11111', '11111', '01110', '00100'] });
const fresh = (): NonoCell[] => new Array<NonoCell>(25).fill('empty');

describe('Mini nonogram rules', () => {
  it('fills picture squares and misses empty ones; only untouched squares respond', () => {
    const cells = fresh();
    expect(nonoTap(heart, cells, 1)).toBe('fill');
    expect(nonoTap(heart, cells, 0)).toBe('miss');
    cells[1] = 'filled';
    cells[0] = 'miss';
    cells[2] = 'marked';
    expect(nonoTap(heart, cells, 1)).toBe('none');
    expect(nonoTap(heart, cells, 0)).toBe('none');
    expect(nonoTap(heart, cells, 2)).toBe('none');
  });

  it('marks and unmarks untouched squares only', () => {
    expect(nonoMark('empty')).toBe('marked');
    expect(nonoMark('marked')).toBe('empty');
    expect(nonoMark('filled')).toBe('filled');
    expect(nonoMark('miss')).toBe('miss');
  });

  it('turns a line done when its picture squares are filled', () => {
    const cells = fresh();
    expect(rowDone(heart, cells, 1)).toBe(false);
    for (let c = 0; c < 5; c++) cells[5 + c] = 'filled';
    expect(rowDone(heart, cells, 1)).toBe(true);
    expect(colDone(heart, cells, 0)).toBe(false);
    cells[10] = 'filled';
    expect(colDone(heart, cells, 0)).toBe(true);
    // An all-empty line is done from the start.
    const blank = grid({ rows: ['00000', '11111', '00000', '00000', '00000'] });
    expect(rowDone(blank, fresh(), 0)).toBe(true);
  });

  it('solves the picture when every picture square is filled, marks and misses aside', () => {
    const cells = fresh();
    heart.flat().forEach((v, i) => (cells[i] = v ? 'filled' : i % 2 ? 'miss' : 'marked'));
    expect(nonoSolved(heart, cells)).toBe(true);
    cells[22] = 'empty';
    expect(nonoSolved(heart, cells)).toBe(false);
  });

  it('solves every pack board by filling exactly its squares', () => {
    for (const b of pack.items as NonoBoard[]) {
      const g = grid(b);
      const cells = fresh();
      g.flat().forEach((v, i) => {
        if (nonoTap(g, cells, i) === 'fill') cells[i] = 'filled';
        expect(nonoTap(g, cells, i) === 'none').toBe(!!v);
      });
      expect(nonoSolved(g, cells)).toBe(true);
    }
  });

  it('keeps the prototype star rule', () => {
    expect(nonoStars(0, true)).toBe(3);
    expect(nonoStars(2, true)).toBe(2);
    expect(nonoStars(0, false)).toBe(1);
  });
});
