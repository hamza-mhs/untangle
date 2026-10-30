import pack from '../content.json';
import { canFinish, isPaintSolution, type PaintBoard } from '../logic';

const boards = pack.items as PaintBoard[];

describe('Path painter pack', () => {
  it('has unique ids', () => {
    expect(boards.length).toBeGreaterThanOrEqual(200);
    expect(new Set(boards.map((b) => b.id)).size).toBe(boards.length);
  });

  it('stores a one-stroke path for every board (Hamiltonian path exists)', () => {
    for (const b of boards) expect(isPaintSolution(b)).toBe(true);
  });

  it('can tell a live position from a trapped one', () => {
    const b = boards[0]!;
    expect(canFinish(b.size, b.rocks, b.path.slice(0, 3))).toBe(true);
    // Boards keep at most 8 working starts, so some free cell is a trap to start from.
    const free = Array.from({ length: b.size * b.size }, (_, i): [number, number] => [
      Math.floor(i / b.size),
      i % b.size,
    ]).filter(([r, c]) => !b.rocks.some(([y, x]) => y === r && x === c));
    expect(free.some((cell) => !canFinish(b.size, b.rocks, [cell]))).toBe(true);
  });
});
