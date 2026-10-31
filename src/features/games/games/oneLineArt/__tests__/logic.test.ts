import pack from '../content.json';
import {
  chooseDrawings,
  closestPair,
  eulerTrail,
  fitDrawing,
  isTrace,
  lineStars,
  oddNodes,
  traceMove,
  type Drawing,
  type Trace,
} from '../logic';

const drawings = pack.items as Drawing[];
const house = drawings.find((d) => d.name === 'House')!;

/** Feeds node indices through `traceMove` and returns the moves. */
function run(d: Drawing, seq: number[]) {
  let tr: Trace | null = null;
  return seq.map((n) => {
    const r = traceMove(d, tr, n);
    tr = r.trace;
    return r.move;
  });
}

describe('traceMove', () => {
  it('draws the stored trail line by line and finishes on the last line', () => {
    const moves = run(house, house.path);
    expect(moves[0]).toBe('start');
    expect(moves.slice(1, -1).every((m) => m === 'line')).toBe(true);
    expect(moves.at(-1)).toBe('done');
  });

  it('every pack drawing can be finished along its stored trail', () => {
    for (const d of drawings) expect(run(d, d.path).at(-1)).toBe('done');
  });

  it('ignores the current node and nodes with no line from it', () => {
    // House: 0 (bottom left) has no line to the roof (4).
    expect(run(house, [0, 0])).toEqual(['start', 'same']);
    expect(run(house, [0, 4])).toEqual(['start', 'none']);
  });

  it('a repeated line is stuck', () => {
    expect(run(house, [0, 1, 0])).toEqual(['start', 'line', 'repeat']);
  });

  it('a dead end with lines left is stuck', () => {
    // Tent: 0 has two lines (to 2 and 3); arriving back with both drawn and lines left.
    const tent = drawings.find((d) => d.name === 'Tent')!;
    expect(run(tent, [2, 0, 3, 2, 1, 3])).toEqual([
      'start',
      'line',
      'line',
      'line',
      'line',
      'done',
    ]);
    expect(run(tent, [0, 2, 3, 0])).toEqual(['start', 'line', 'line', 'deadEnd']);
  });

  it('does not mutate the previous trace', () => {
    const t0: Trace = { at: 0, used: [] };
    traceMove(house, t0, 1);
    expect(t0).toEqual({ at: 0, used: [] });
  });
});

describe('chooseDrawings', () => {
  type Item = { id: string; name?: string };
  const a: Item = { id: 'a' };
  const b: Item = { id: 'b' };
  const n: Item = { id: 'n', name: 'House' };

  it('keeps the first two when one is named', () => {
    expect(chooseDrawings([a, n, b])).toEqual([a, n]);
  });

  it('brings in the first named icon when the first two are unnamed', () => {
    expect(chooseDrawings([a, b, n])).toEqual([n, a]);
  });

  it('falls back to the first two when nothing is named', () => {
    expect(chooseDrawings<Item>([a, b, { id: 'c' }])).toEqual([a, b]);
    expect(chooseDrawings([a])).toEqual([a]);
  });
});

describe('fitDrawing', () => {
  it('fits the 0–4 lattice into the box with padding, centred', () => {
    const { points, unit } = fitDrawing(
      [
        [0, 0],
        [4, 4],
      ],
      300,
      500,
      20,
    );
    expect(unit).toBe(65);
    expect(points[0]).toEqual({ x: 20, y: 120 });
    expect(points[1]).toEqual({ x: 280, y: 380 });
  });

  it('grows the frame for nodes outside the lattice', () => {
    const { points } = fitDrawing(
      [
        [0, 0],
        [4.5, 4],
      ],
      300,
      300,
      0,
    );
    expect(points[1]!.x).toBeCloseTo(300);
    expect(points[0]!.x).toBeCloseTo(0);
  });
});

describe('helpers', () => {
  it('closestPair', () => {
    expect(
      closestPair([
        [0, 0],
        [3, 4],
        [0, 1],
      ]),
    ).toBe(1);
  });

  it('house has two odd points and its Euler trail is a trace', () => {
    expect(oddNodes(house.nodes.length, house.edges)).toHaveLength(2);
    expect(isTrace({ edges: house.edges, path: eulerTrail(house.nodes.length, house.edges) })).toBe(
      true,
    );
  });

  it('lineStars', () => {
    expect(lineStars(0, 2)).toBe(3);
    expect(lineStars(1, 2)).toBe(2);
    expect(lineStars(0, 1)).toBe(2);
    expect(lineStars(0, 0)).toBe(1);
  });
});
