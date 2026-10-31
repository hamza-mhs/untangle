import pack from '../content.json';
import {
  brokenFlows,
  flowInit,
  flowStars,
  flowStart,
  flowStep,
  flowTap,
  isJoined,
  isSolved,
  jewelOf,
  ownerOf,
  type FlowBoard,
  type FlowState,
} from '../logic';

const boards = pack.items as FlowBoard[];

// 3×3: colour 0 joins cells 0 → 2 along the top; colour 1 joins 3 → 8 through the rest.
//  0 0 0
//  1 1 1
//  1 1 1
const tiny: FlowBoard = {
  id: 't',
  size: 3,
  flows: [
    { a: [0, 0], b: [0, 2], path: [] },
    { a: [1, 0], b: [2, 2], path: [] },
  ],
};

/** Draws a whole tube the way a drag does: start, then one step per cell. */
function draw(s: FlowState, cells: number[]) {
  const first = flowStart(s, cells[0]!);
  let state = first.state;
  for (const i of cells.slice(1)) state = flowStep(state, first.active, i).state;
  return state;
}

describe('Flow lines drawing', () => {
  it('finds jewels and owners', () => {
    const s = draw(flowInit(tiny), [0, 1]);
    expect(jewelOf(s, 0)).toBe(0);
    expect(jewelOf(s, 8)).toBe(1);
    expect(jewelOf(s, 4)).toBe(-1);
    expect(ownerOf(s, 1)).toBe(0);
    expect(ownerOf(s, 4)).toBe(-1);
  });

  it('joins a pair and solves the board when every cell is filled', () => {
    let s = draw(flowInit(tiny), [0, 1, 2]);
    expect(isJoined(s, 0)).toBe(true);
    expect(isSolved(s)).toBe(false);
    s = draw(s, [3, 6, 7, 4, 5, 8]);
    expect(isJoined(s, 1)).toBe(true);
    expect(isSolved(s)).toBe(true);
  });

  it('can be drawn from either jewel', () => {
    const s = draw(flowInit(tiny), [2, 1, 0]);
    expect(isJoined(s, 0)).toBe(true);
  });

  it('is not solved when all pairs are joined but a square is empty', () => {
    const s = draw(draw(flowInit(tiny), [0, 1, 2]), [3, 6, 7, 8]);
    expect(isJoined(s, 1)).toBe(true);
    expect(isSolved(s)).toBe(false);
  });

  it('shortens the tube when dragging back over it', () => {
    const s0 = draw(flowInit(tiny), [3, 4, 7]);
    const s1 = flowStep(s0, 1, 4).state;
    expect(s1.tubes[1]).toEqual([3, 4]);
  });

  it('stops at the jewel once joined', () => {
    const s0 = draw(flowInit(tiny), [0, 1, 2]);
    expect(flowStep(s0, 0, 5).state).toBe(s0);
  });

  it("blocks another colour's jewel", () => {
    const s1 = draw(flowInit(tiny), [0]);
    const b = flowStep(s1, 0, 3);
    expect(b.blocked).toBe(true);
    expect(b.state).toBe(s1);
  });

  it("cuts another colour's tube where it is crossed", () => {
    const s0 = draw(flowInit(tiny), [3, 4, 1, 2]); // colour 1 wanders into the top row
    const s1 = draw(s0, [0, 1]); // colour 0 crosses at cell 1
    expect(s1.tubes[0]).toEqual([0, 1]);
    expect(s1.tubes[1]).toEqual([3, 4]);
  });

  it('ignores non-adjacent cells', () => {
    const s0 = draw(flowInit(tiny), [3]);
    expect(flowStep(s0, 1, 8).state).toBe(s0);
  });

  it('restarts from a jewel, and continues from a tube cell', () => {
    const s0 = draw(flowInit(tiny), [3, 4, 7]);
    expect(flowStart(s0, 8).state.tubes[1]).toEqual([8]);
    const mid = flowStart(s0, 4);
    expect(mid.active).toBe(1);
    expect(mid.state.tubes[1]).toEqual([3, 4]);
    expect(flowStart(s0, 5).active).toBe(-1);
  });

  it('lets taps continue the active tube one cell at a time', () => {
    let s = flowInit(tiny);
    let a = -1;
    for (const i of [0, 1, 2]) {
      const r = flowTap(s, a, i);
      s = r.state;
      a = r.active;
    }
    expect(isJoined(s, 0)).toBe(true);
    // A tap on another colour's jewel starts that colour instead.
    const r = flowTap(draw(flowInit(tiny), [0]), 0, 3);
    expect(r.active).toBe(1);
    expect(r.blocked).toBe(false);
    // A tap far from the open end is a fresh start (empty cell: nothing).
    expect(flowTap(draw(flowInit(tiny), [0]), 0, 7).active).toBe(-1);
  });

  it('counts a redraw only for colours joined at the last lift', () => {
    const joined = draw(flowInit(tiny), [0, 1, 2]);
    const broken = flowStart(joined, 1).state; // cut back to [0, 1]
    expect(brokenFlows(broken, [false, false])).toEqual([]);
    expect(brokenFlows(broken, [true, false])).toEqual([0]);
    expect(brokenFlows(joined, [true, false])).toEqual([]);
  });

  it('every pack solution can be drawn cell by cell to a solved board', () => {
    for (const b of boards) {
      let s = flowInit(b);
      for (const f of b.flows)
        s = draw(
          s,
          f.path.map(([r, c]) => r * b.size + c),
        );
      expect(isSolved(s)).toBe(true);
    }
  });
});

describe('Flow lines stars', () => {
  it('keeps the prototype top rule: both boards, no redraws = 3', () => {
    expect(flowStars(0, 2)).toBe(3);
    expect(flowStars(1, 2)).toBe(2);
    expect(flowStars(0, 1)).toBe(2);
    expect(flowStars(0, 0)).toBe(1);
  });
});
