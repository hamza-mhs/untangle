import {
  extraTurns,
  flip,
  isValidLevel,
  laserLevel,
  laserStars,
  LASER_LABS,
  solveTurns,
  traceBeam,
  type LaserLevel,
} from '../logic';

/** The prototype's first lab: both mirrors need a turn. */
const PROTO: Omit<LaserLevel, 'id' | 'minTurns'> = {
  emitter: [0, 0],
  dir: 'R',
  reactor: [3, 0],
  walls: [],
  mirrors: [
    { cell: [0, 3], start: '/' },
    { cell: [3, 3], start: '\\' },
  ],
};

describe('Laser lab', () => {
  it('traces the prototype lab: misses at the start, hits with both mirrors turned', () => {
    const miss = traceBeam(PROTO, ['/', '\\']);
    expect(miss.hit).toBe(false);
    // Bounces up off the first mirror and leaves the top edge.
    expect(miss.points.at(-1)).toEqual([3.5, 0]);
    const hit = traceBeam(PROTO, ['\\', '/']);
    expect(hit.hit).toBe(true);
    expect(hit.points).toEqual([
      [0.94, 0.5],
      [3.5, 0.5],
      [3.5, 3.5],
      [0.88, 3.5],
    ]);
    expect(hit.cells).toHaveLength(9);
    expect(solveTurns(PROTO, ['/', '\\'])).toBe(2);
  });

  it('stops the beam at walls and at the emitter', () => {
    const walled = { ...PROTO, walls: [[0, 2] as const] };
    const t = traceBeam(walled, ['\\', '/']);
    expect(t.hit).toBe(false);
    expect(t.points.at(-1)).toEqual([2.1, 0.5]);
    // A loop back into the emitter ends there instead of passing through.
    const loop = {
      ...PROTO,
      reactor: [4, 4] as const,
      mirrors: [
        { cell: [0, 3] as const, start: '\\' as const },
        { cell: [3, 3] as const, start: '/' as const },
        { cell: [3, 0] as const, start: '\\' as const },
      ],
    };
    const back = traceBeam(loop, ['\\', '/', '\\']);
    expect(back.hit).toBe(false);
    expect(back.cells.at(-1)).toEqual([0, 0]);
  });

  it('generates valid, solvable labs that start unsolved, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      for (let i = 0; i < LASER_LABS; i++) {
        const level = laserLevel(seed, i);
        expect(isValidLevel(level)).toBe(true);
        const start = level.mirrors.map((m) => m.start);
        expect(traceBeam(level, start).hit).toBe(false);
        expect(level.minTurns).toBeGreaterThanOrEqual(1);
        expect(level.minTurns).toBe(solveTurns(level, start));
        expect(level.id).toBe(`laser-${seed}-${i}`);
      }
    }
  });

  it('records minTurns that really is the fewest taps', () => {
    for (let seed = 0; seed < 50; seed++) {
      const level = laserLevel(seed, 2);
      const start = level.mirrors.map((m) => m.start);
      const n = start.length;
      for (let mask = 0; mask < 1 << n; mask++) {
        const tilts = start.map((t, i) => (mask & (1 << i) ? flip(t) : t));
        const taps = start.filter((_, i) => mask & (1 << i)).length;
        if (traceBeam(level, tilts).hit) expect(taps).toBeGreaterThanOrEqual(level.minTurns);
      }
    }
  });

  it('is deterministic per seed and lab', () => {
    expect(laserLevel(42, 1)).toEqual(laserLevel(42, 1));
    expect(laserLevel(42, 0)).not.toEqual(laserLevel(42, 1));
  });

  it('counts extra turns and keeps the prototype top star rule', () => {
    expect(extraTurns(4, 2)).toBe(2);
    expect(extraTurns(1, 2)).toBe(0);
    expect(laserStars(3, 0)).toBe(3);
    expect(laserStars(3, 2)).toBe(2);
    expect(laserStars(2, 0)).toBe(2);
    expect(laserStars(0, 0)).toBe(1);
  });
});
