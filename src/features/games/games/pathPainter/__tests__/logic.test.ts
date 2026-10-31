import pack from '../content.json';
import {
  cornerTip,
  freeCount,
  isPainted,
  isTrapped,
  paintHue,
  paintMove,
  paintStars,
  paintTouch,
  restartIsWipe,
  type Cell,
  type PaintBoard,
} from '../logic';

const boards = pack.items as PaintBoard[];
// 5×5, rock in the middle (prototype board 2).
const N = 5;
const ROCKS: Cell[] = [[2, 2]];
const idx = (r: number, c: number) => r * N + c;

describe('Path painter rules', () => {
  it('extends only onto a free, unpainted neighbour of the head', () => {
    const path = [idx(0, 0), idx(0, 1)];
    expect(paintMove(N, ROCKS, path, idx(0, 2))).toBe('extend');
    expect(paintMove(N, ROCKS, path, idx(1, 1))).toBe('extend');
    // Diagonal, far away, already painted.
    expect(paintMove(N, ROCKS, path, idx(1, 2))).toBe('none');
    expect(paintMove(N, ROCKS, path, idx(4, 4))).toBe('none');
    expect(paintMove(N, ROCKS, [idx(1, 1), idx(1, 2), idx(0, 2), idx(0, 1)], idx(1, 1))).toBe(
      'none',
    );
    // Rock.
    expect(paintMove(N, ROCKS, [idx(1, 2)], idx(2, 2))).toBe('none');
    // Nothing to extend yet.
    expect(paintMove(N, ROCKS, [], idx(0, 0))).toBe('none');
  });

  it('undoes the last step when dragging back onto the previous cell', () => {
    expect(paintMove(N, ROCKS, [idx(0, 0), idx(0, 1)], idx(0, 0))).toBe('undo');
    expect(paintMove(N, ROCKS, [idx(0, 0)], idx(0, 0))).toBe('none');
  });

  it('reads a new touch: continue at the head, step by tap, otherwise start over', () => {
    const path = [idx(0, 0), idx(0, 1)];
    expect(paintTouch(N, ROCKS, path, idx(0, 1))).toBe('continue');
    expect(paintTouch(N, ROCKS, path, idx(0, 2))).toBe('extend');
    expect(paintTouch(N, ROCKS, path, idx(0, 0))).toBe('undo');
    expect(paintTouch(N, ROCKS, path, idx(4, 4))).toBe('restart');
    expect(paintTouch(N, ROCKS, [], idx(3, 3))).toBe('restart');
    expect(paintTouch(N, ROCKS, path, idx(2, 2))).toBe('none');
  });

  it('counts a restart as a wipe only after a stroke', () => {
    expect(restartIsWipe([])).toBe(false);
    expect(restartIsWipe([3])).toBe(false);
    expect(restartIsWipe([3, 4])).toBe(true);
  });

  it('spots a trapped head (the prototype demo stroke) but not a live one', () => {
    const demo = [idx(2, 3), idx(1, 3), idx(1, 2), idx(1, 1), idx(2, 1)];
    expect(isTrapped(N, ROCKS, demo)).toBe(false);
    // Corner (0,0) after painting both its neighbours.
    expect(isTrapped(N, ROCKS, [idx(1, 0), idx(1, 1), idx(0, 1), idx(0, 0)])).toBe(true);
    expect(isTrapped(N, ROCKS, [])).toBe(false);
  });

  it('is never trapped along a stored solution, and the full path paints the board', () => {
    for (const b of boards.slice(0, 100)) {
      const path = b.path.map(([r, c]) => r * b.size + c);
      for (let k = 1; k <= path.length; k++) {
        expect(isTrapped(b.size, b.rocks, path.slice(0, k))).toBe(false);
        if (k > 1)
          expect(paintMove(b.size, b.rocks, path.slice(0, k - 1), path[k - 1]!)).toBe('extend');
      }
      expect(path).toHaveLength(freeCount(b.size, b.rocks));
      expect(isPainted(b.size, b.rocks, path)).toBe(true);
      expect(isPainted(b.size, b.rocks, path.slice(1))).toBe(false);
    }
  });

  it('cycles the enamel hue every 5 squares', () => {
    expect([0, 4, 5, 9, 10, 24, 25].map(paintHue)).toEqual([
      'sky',
      'sky',
      'mint',
      'mint',
      'sun',
      'pink',
      'sky',
    ]);
  });

  it('tips "corner" only when the stored solution ends in one', () => {
    expect(
      cornerTip({
        size: 5,
        path: [
          [0, 0],
          [0, 1],
        ],
      }),
    ).toBe(true);
    expect(
      cornerTip({
        size: 5,
        path: [
          [1, 1],
          [4, 4],
        ],
      }),
    ).toBe(true);
    expect(
      cornerTip({
        size: 5,
        path: [
          [1, 1],
          [1, 2],
        ],
      }),
    ).toBe(false);
  });

  it('stars: 3 clean, 2 with wipes or one board, 1 with none', () => {
    expect(paintStars(0, 2)).toBe(3);
    expect(paintStars(1, 2)).toBe(2);
    expect(paintStars(0, 1)).toBe(2);
    expect(paintStars(0, 0)).toBe(1);
  });
});
