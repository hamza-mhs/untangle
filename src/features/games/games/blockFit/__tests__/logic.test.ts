import { rng } from '@/lib/rng';
import { canPlace, emptyBoard, fitsAnywhere, fitStars, makeTray, PIECES, place } from '../logic';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 13);

describe('Block fit', () => {
  it('places pieces and clears full lines', () => {
    let b = emptyBoard();
    const i4 = PIECES.find((p) => p.id === 'i4')!;
    b = place(b, i4, 0, 0).board;
    expect(canPlace(b, i4, 0, 0)).toBe(false);
    const r = place(b, i4, 0, 4);
    expect(r.lines).toBe(1);
    expect(r.board[0]!.every((x) => !x)).toBe(true);
  });
  it('rejects off-board placements', () => {
    const sq = PIECES.find((p) => p.id === 'sq')!;
    expect(canPlace(emptyBoard(), sq, 7, 7)).toBe(false);
    expect(canPlace(emptyBoard(), sq, 6, 6)).toBe(true);
  });
  it('a fresh tray always has a piece that fits, for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const rand = rng(s);
      // A crowded board: random filled cells, then a tray.
      let b = emptyBoard();
      for (let k = 0; k < 40; k++) {
        const p = PIECES[Math.floor(rand() * PIECES.length)]!;
        const r = Math.floor(rand() * 8);
        const c = Math.floor(rand() * 8);
        if (canPlace(b, p, r, c)) b = place(b, p, r, c).board;
      }
      const tray = makeTray(rand, b);
      const anyFits = PIECES.some((p) => fitsAnywhere(b, p));
      if (anyFits) expect(tray.some((p) => fitsAnywhere(b, p))).toBe(true);
    }
  });
  it('stars', () => {
    expect([fitStars(4, 0), fitStars(4, 1), fitStars(0, 0)]).toEqual([3, 2, 1]);
  });
});
