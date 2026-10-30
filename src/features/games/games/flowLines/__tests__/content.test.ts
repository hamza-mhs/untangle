import pack from '../content.json';
import { countFlowSolutions, isFlowSolution, type FlowBoard } from '../logic';

const boards = pack.items as FlowBoard[];

describe('Flow lines pack', () => {
  it('has enough 5×5 and 6×6 boards with unique ids', () => {
    expect(boards.filter((b) => b.size === 5).length).toBeGreaterThanOrEqual(150);
    expect(boards.filter((b) => b.size === 6).length).toBeGreaterThanOrEqual(80);
    expect(new Set(boards.map((b) => b.id)).size).toBe(boards.length);
  });

  it('stores a valid solution for every board', () => {
    for (const b of boards) expect(isFlowSolution(b)).toBe(true);
  });

  it('re-solves every board: exactly one solution', () => {
    for (const b of boards) expect(countFlowSolutions(b.size, b.flows, 2)).toBe(1);
  });
});
