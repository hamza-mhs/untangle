import pack from '../content.json';
import {
  allRanges,
  dragSnap,
  gemExit,
  isEscaped,
  moved,
  occupied,
  pickBoardPair,
  pieces,
  slideStars,
  tapSlide,
  type Block,
  type SlideBoard,
} from '../logic';

const boards = pack.items as SlideBoard[];

// Prototype board 1: gem on row 2, a v block in its way at column 2.
const B: Block[] = [
  { d: 'h', r: 0, c: 2, len: 2 },
  { d: 'v', r: 1, c: 2, len: 2 },
  { d: 'v', r: 2, c: 4, len: 2 },
  { d: 'v', r: 3, c: 1, len: 2 },
];
const start = () => pieces([2, 0], B);

describe('Slide escape', () => {
  it('maps cells to pieces', () => {
    const occ = occupied(start());
    expect(occ).toHaveLength(25);
    expect(occ[2 * 5 + 0]).toBe(0);
    expect(occ[2 * 5 + 1]).toBe(0);
    expect(occ[1 * 5 + 2]).toBe(2);
    expect(occ[2 * 5 + 2]).toBe(2);
    expect(occ[0]).toBe(-1);
  });

  it('gives each piece its slide range', () => {
    const r = allRanges(start());
    expect(r[0]).toEqual([0, 0]); // gem: wall left, block right
    expect(r[1]).toEqual([-2, 1]);
    expect(r[2]).toEqual([0, 2]); // h block above it, free below
  });

  it('only lets the gem out when its row is clear to the edge', () => {
    let ps = start();
    expect(gemExit(ps)).toBeNull();
    ps = moved(ps, 1, -2); // top block out of column 2
    ps = moved(ps, 2, -1); // column-2 block up
    expect(gemExit(ps)).toBeNull(); // column-4 block still in row 2
    ps = moved(ps, 3, 1);
    expect(gemExit(ps)).toBe(3);
    expect(isEscaped(moved(ps, 0, 3))).toBe(true);
  });

  it('resolves tap-to-move: slides, blocked pushes and taps off the line', () => {
    const ps = start();
    expect(tapSlide(ps, 1, 0, 0)).toEqual({ kind: 'slide', by: -2 });
    expect(tapSlide(ps, 1, 0, 4)).toEqual({ kind: 'slide', by: 1 });
    expect(tapSlide(ps, 1, 1, 0)).toEqual({ kind: 'off' });
    expect(tapSlide(ps, 1, 0, 3)).toEqual({ kind: 'off' }); // under the piece itself
    expect(tapSlide(ps, 2, 0, 2)).toEqual({ kind: 'blocked', dir: -1 });
    expect(tapSlide(ps, 2, 4, 2)).toEqual({ kind: 'slide', by: 2 });
    expect(tapSlide(ps, 0, 2, 4)).toEqual({ kind: 'blocked', dir: 1 });
  });

  it('snaps drags to whole cells inside the range and spots bumps', () => {
    expect(dragSnap(1.4, -2, 1)).toEqual({ by: 1, bump: 0 });
    expect(dragSnap(-2.8, -2, 1)).toEqual({ by: -2, bump: 0 });
    expect(dragSnap(0.3, -2, 1)).toEqual({ by: 0, bump: 0 });
    expect(dragSnap(-0.2, 0, 1)).toEqual({ by: 0, bump: 0 });
    expect(dragSnap(0.7, -1, 0)).toEqual({ by: 0, bump: 1 });
    expect(dragSnap(-0.6, 0, 2)).toEqual({ by: 0, bump: -1 });
    expect(Object.is(dragSnap(-0.3, -1, 1).by, -0)).toBe(false);
  });

  it('picks an easy board, then a harder one, when the pack allows', () => {
    const [a, b] = pickBoardPair(boards);
    expect(a!.minMoves).toBeLessThanOrEqual(5);
    expect(b!.minMoves).toBeGreaterThan(5);
    const easyOnly = boards.filter((x) => x.minMoves <= 5).slice(0, 3);
    const pair = pickBoardPair([easyOnly[2]!, easyOnly[0]!]);
    expect(pair).toHaveLength(2);
    expect(pair[0]!.minMoves).toBeLessThanOrEqual(pair[1]!.minMoves);
    expect(pickBoardPair([boards[0]!])).toHaveLength(1);
  });

  it('keeps the prototype star rule: 3 for both boards, 2 for one, 1 for none', () => {
    expect(slideStars(2)).toBe(3);
    expect(slideStars(1)).toBe(2);
    expect(slideStars(0)).toBe(1);
  });
});
