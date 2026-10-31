import { randInt, rng, shuffle } from '@/lib/rng';

export const LASER_SECONDS = 60;
export const LASER_LABS = 3;
export const LASER_SIZE = 5;
export const LASER_POINTS = 50;
/** Prototype trace cap (a beam can't run longer than this on a 5×5 board). */
const MAX_STEPS = 40;

export type Cell = readonly [r: number, c: number];
export type Dir = 'R' | 'L' | 'U' | 'D';
export type Tilt = '/' | '\\';
export type Mirror = { cell: Cell; start: Tilt };

export type LaserLevel = {
  id: string;
  emitter: Cell;
  /** The way the emitter fires (fixed). */
  dir: Dir;
  reactor: Cell;
  walls: Cell[];
  mirrors: Mirror[];
  /** Fewest taps from the start tilts to a setting that lights the reactor. */
  minTurns: number;
};

/** Where the beam went: `points` in grid units (cell (r, c) spans x c…c+1, y r…r+1). */
export type Trace = {
  points: [x: number, y: number][];
  /** Cells the beam entered, in order (the emitter excluded). */
  cells: Cell[];
  hit: boolean;
};

export const STEP: Record<Dir, Cell> = { R: [0, 1], L: [0, -1], U: [-1, 0], D: [1, 0] };
/** Prototype bounce tables. */
const BOUNCE: Record<Tilt, Record<Dir, Dir>> = {
  '/': { R: 'U', U: 'R', L: 'D', D: 'L' },
  '\\': { R: 'D', D: 'R', L: 'U', U: 'L' },
};

export function flip(t: Tilt): Tilt {
  return t === '/' ? '\\' : '/';
}

const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];
const inside = ([r, c]: Cell) => r >= 0 && r < LASER_SIZE && c >= 0 && c < LASER_SIZE;
const centre = ([r, c]: Cell): [number, number] => [c + 0.5, r + 0.5];

/**
 * Traces the beam for the given mirror tilts (one per `level.mirrors`). It stops at a wall,
 * the emitter, the reactor (a hit) or the board edge. Stop offsets match the prototype
 * (22, 20 and 19 px of a 50 px cell).
 */
export function traceBeam(level: Omit<LaserLevel, 'id' | 'minTurns'>, tilts: Tilt[]): Trace {
  let [r, c] = level.emitter;
  let d = level.dir;
  const [ex, ey] = centre(level.emitter);
  const points: [number, number][] = [[ex + STEP[d][1] * 0.44, ey + STEP[d][0] * 0.44]];
  const cells: Cell[] = [];
  for (let s = 0; s < MAX_STEPS; s++) {
    const [dr, dc] = STEP[d];
    r += dr;
    c += dc;
    const here: Cell = [r, c];
    if (!inside(here)) {
      const [x, y] = centre([r - dr, c - dc]);
      points.push([x + dc * 0.5, y + dr * 0.5]);
      return { points, cells, hit: false };
    }
    cells.push(here);
    const [x, y] = centre(here);
    if (level.walls.some((w) => same(w, here)) || same(level.emitter, here)) {
      points.push([x - dc * 0.4, y - dr * 0.4]);
      return { points, cells, hit: false };
    }
    if (same(level.reactor, here)) {
      points.push([x - dc * 0.38, y - dr * 0.38]);
      return { points, cells, hit: true };
    }
    const k = level.mirrors.findIndex((m) => same(m.cell, here));
    if (k >= 0) {
      points.push([x, y]);
      d = BOUNCE[tilts[k]!][d];
    }
  }
  return { points, cells, hit: false };
}

/** Fewest tilt changes from `start` that light the reactor (brute force: ≤ 2⁵ settings). */
export function solveTurns(level: Omit<LaserLevel, 'id' | 'minTurns'>, start: Tilt[]): number {
  let best = Infinity;
  const n = start.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const tilts = start.map((t, i) => (mask & (1 << i) ? flip(t) : t));
    if (!traceBeam(level, tilts).hit) continue;
    let bits = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) bits++;
    best = Math.min(best, bits);
  }
  return best;
}

/** Labs get busier through the round: [turns on the route, decoy mirrors]. */
const SHAPE: [turns: [number, number], decoys: [number, number]][] = [
  [
    [2, 2],
    [1, 1],
  ],
  [
    [2, 3],
    [1, 2],
  ],
  [
    [3, 3],
    [1, 2],
  ],
];

const DIRS: Dir[] = ['R', 'L', 'U', 'D'];

/** One attempt at a lab: builds a route first, then hides it. `null` when the walk got stuck. */
function tryLevel(rand: () => number, index: number): Omit<LaserLevel, 'id'> | null {
  const [turnRange, decoyRange] = SHAPE[Math.min(index, SHAPE.length - 1)]!;
  const turns = turnRange[0] + randInt(rand, turnRange[1] - turnRange[0] + 1);
  const decoys = decoyRange[0] + randInt(rand, decoyRange[1] - decoyRange[0] + 1);
  const emitter: Cell = [randInt(rand, LASER_SIZE), randInt(rand, LASER_SIZE)];
  const dir = shuffle(DIRS, rand).find((d) =>
    inside([emitter[0] + STEP[d][0], emitter[1] + STEP[d][1]]),
  )!;
  const used = new Set([`${emitter[0]},${emitter[1]}`]);
  const key = ([r, c]: Cell) => `${r},${c}`;
  const route: Mirror[] = [];
  const solution: Tilt[] = [];
  let at: Cell = emitter;
  let d = dir;
  let reactor: Cell | null = null;
  for (let leg = 0; leg <= turns; leg++) {
    // Free run of cells ahead in direction d.
    const run: Cell[] = [];
    for (let p: Cell = [at[0] + STEP[d][0], at[1] + STEP[d][1]]; inside(p) && !used.has(key(p));) {
      run.push(p);
      p = [p[0] + STEP[d][0], p[1] + STEP[d][1]];
    }
    if (!run.length) return null;
    const len = 1 + randInt(rand, run.length);
    run.slice(0, len).forEach((p) => used.add(key(p)));
    at = run[len - 1]!;
    if (leg === turns) {
      reactor = at;
      break;
    }
    // Turn here with a mirror; the tilt that makes the turn is the solution.
    const nd = shuffle(
      d === 'R' || d === 'L' ? (['U', 'D'] as Dir[]) : (['R', 'L'] as Dir[]),
      rand,
    )[0]!;
    const tilt: Tilt = BOUNCE['/'][d] === nd ? '/' : '\\';
    route.push({ cell: at, start: tilt });
    solution.push(tilt);
    d = nd;
  }
  if (!reactor) return null;
  const free = shuffle(
    Array.from({ length: LASER_SIZE * LASER_SIZE }, (_, i): Cell => [
      Math.floor(i / LASER_SIZE),
      i % LASER_SIZE,
    ]).filter((p) => !used.has(key(p))),
    rand,
  );
  const wallCount = 2 + randInt(rand, 3);
  if (free.length < wallCount + decoys) return null;
  const walls = free.slice(0, wallCount);
  const decoyMirrors: Mirror[] = free
    .slice(wallCount, wallCount + decoys)
    .map((cell) => ({ cell, start: rand() < 0.5 ? '/' : '\\' }));
  // Start: at least one route mirror (two from the second lab) turned the wrong way.
  const wrong = Math.min(route.length, index === 0 ? 1 + randInt(rand, 2) : 2 + randInt(rand, 2));
  const flipped = new Set(
    shuffle(
      route.map((_, i) => i),
      rand,
    ).slice(0, wrong),
  );
  const all = shuffle(
    [
      ...route.map((m, i) => ({ cell: m.cell, start: flipped.has(i) ? flip(m.start) : m.start })),
      ...decoyMirrors,
    ],
    rand,
  );
  const level = { emitter, dir, reactor, walls, mirrors: all };
  const start = all.map((m) => m.start);
  if (traceBeam(level, start).hit) return null;
  const minTurns = solveTurns(level, start);
  if (!Number.isFinite(minTurns) || minTurns < 1) return null;
  return { ...level, minTurns };
}

/** Stable id for a generated lab (reported as the round's `items`). */
export function laserId(seed: number, index: number): string {
  return `laser-${seed}-${index}`;
}

/**
 * Lab `index` (0-based) of the round with this seed: emitter, reactor, 2–4 walls and 3–5
 * mirrors; some tilt setting lights the reactor and the start setting doesn't.
 */
export function laserLevel(seed: number, index: number): LaserLevel {
  const rand = rng((seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  for (;;) {
    const level = tryLevel(rand, index);
    if (level) return { id: laserId(seed, index), ...level };
  }
}

/** Layout rules the generator promises (tests and a guard for the board). */
export function isValidLevel(level: LaserLevel): boolean {
  const cells = [level.emitter, level.reactor, ...level.walls, ...level.mirrors.map((m) => m.cell)];
  const keys = new Set(cells.map(([r, c]) => `${r},${c}`));
  const [dr, dc] = STEP[level.dir];
  return (
    cells.every(inside) &&
    keys.size === cells.length &&
    level.walls.length >= 2 &&
    level.walls.length <= 4 &&
    level.mirrors.length >= 3 &&
    level.mirrors.length <= 5 &&
    inside([level.emitter[0] + dr, level.emitter[1] + dc])
  );
}

/** Taps beyond the fewest needed for a lab. */
export function extraTurns(taps: number, minTurns: number): number {
  return Math.max(0, taps - minTurns);
}

/** Prototype top rule (no extra turns → 3★) once all labs are lit; 1★ if none lit. */
export function laserStars(labs: number, extra: number): 1 | 2 | 3 {
  if (labs === 0) return 1;
  return labs >= LASER_LABS && extra === 0 ? 3 : 2;
}
