import { pick, randInt, rng, shuffle } from '@/lib/rng';

/**
 * Pure rules for the hero games (BATCH-3.1 §B). Every generator takes a seed; scoring follows
 * the prototype's thresholds. UI lives in each game's Round.
 */

// ───────────────────────── Colour word ─────────────────────────

export const INKS = ['red', 'blue', 'green', 'yellow'] as const;
export type Ink = (typeof INKS)[number];
export const COLOUR_TRIALS = 14;

export type ColourTrial = { word: Ink; ink: Ink };

/** 14 trials; about 80 % incongruent (the word names a different colour than its ink). */
export function colourTrials(seed: number, n = COLOUR_TRIALS): ColourTrial[] {
  const rand = rng(seed);
  return Array.from({ length: n }, () => {
    const ink = pick(INKS, rand);
    const congruent = rand() < 0.2;
    const word = congruent
      ? ink
      : pick(
          INKS.filter((c) => c !== ink),
          rand,
        );
    return { word, ink };
  });
}

export function colourStars(right: number): 1 | 2 | 3 {
  return right >= 13 ? 3 : right >= 9 ? 2 : 1;
}

// ───────────────────────── Middle arrow ─────────────────────────

export type Dir = 'left' | 'right';
export type ArrowTrial = { middle: Dir; flank: Dir };
export const ARROW_TRIALS = 20;

/** Half congruent, half incongruent flankers, shuffled. */
export function arrowTrials(seed: number, n = ARROW_TRIALS): ArrowTrial[] {
  const rand = rng(seed);
  const base = Array.from({ length: n }, (_, i) => {
    const middle: Dir = rand() < 0.5 ? 'left' : 'right';
    const flank: Dir = i % 2 === 0 ? middle : middle === 'left' ? 'right' : 'left';
    return { middle, flank };
  });
  return shuffle(base, rand);
}

export function averageMs(times: readonly number[]): number {
  return times.length ? Math.round(times.reduce((s, x) => s + x, 0) / times.length) : 0;
}

export function arrowStars(right: number): 1 | 2 | 3 {
  return right >= 15 ? 3 : right >= 8 ? 2 : 1;
}

// ───────────────────────── Don't tap red ─────────────────────────

export const TAP_COLS = 3;
export const TAP_ROWS = 4;
export type Pop = { at: number; cell: number; red: boolean; ttl: number };

/**
 * The pop-up schedule for a 30 s round: a shape every 450–700 ms (faster later), visible for
 * 900 ms (850 later), about 28 % red, never two live shapes in the same cell.
 */
export function popSchedule(seed: number, durationMs = 30_000): Pop[] {
  const rand = rng(seed);
  const pops: Pop[] = [];
  let at = 400;
  while (at < durationMs - 300) {
    const ttl = at > durationMs / 2 ? 850 : 900;
    const busy = new Set(pops.filter((p) => p.at + p.ttl > at).map((p) => p.cell));
    const free = Array.from({ length: TAP_COLS * TAP_ROWS }, (_, i) => i).filter(
      (c) => !busy.has(c),
    );
    if (free.length) pops.push({ at, cell: pick(free, rand), red: false, ttl });
    at += Math.round((at > durationMs / 2 ? 450 : 560) + rand() * 140);
  }
  // Exactly 28 % red, spread at random (never the first one).
  const reds = shuffle(pops.map((_, i) => i).slice(1), rand).slice(
    0,
    Math.round(pops.length * 0.28),
  );
  for (const i of reds) pops[i]!.red = true;
  return pops;
}

export function redStars(hits: number, slips: number): 1 | 2 | 3 {
  if (hits < 6) return 1;
  return slips ? 2 : 3;
}

// ───────────────────────── Echo (2-back) ─────────────────────────

export const ECHO_SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hex'] as const;
export type EchoShape = (typeof ECHO_SHAPES)[number];
export const ECHO_ITEMS = 16;
export const ECHO_MATCHES = 5;

/** 16 shapes with exactly 5 "same as two back" positions (none in the first two). */
export function echoSequence(seed: number, n = ECHO_ITEMS, matches = ECHO_MATCHES): EchoShape[] {
  const rand = rng(seed);
  const slots = shuffle(
    Array.from({ length: n - 2 }, (_, i) => i + 2),
    rand,
  ).slice(0, matches);
  const isMatch = new Set(slots);
  const seq: EchoShape[] = [];
  for (let i = 0; i < n; i++) {
    if (isMatch.has(i)) seq.push(seq[i - 2]!);
    else {
      const avoid = i >= 2 ? seq[i - 2] : undefined;
      seq.push(
        pick(
          ECHO_SHAPES.filter((s) => s !== avoid),
          rand,
        ),
      );
    }
  }
  return seq;
}

export function echoIsMatch(seq: readonly EchoShape[], i: number): boolean {
  return i >= 2 && seq[i] === seq[i - 2];
}

export function echoStars(right: number): 1 | 2 | 3 {
  return right >= 14 ? 3 : right >= 10 ? 2 : 1;
}

// ───────────────────────── Card pairs ─────────────────────────

export const PAIRS = 6;
export const PAIR_FACES = [
  'sun',
  'moon',
  'star',
  'heart',
  'leaf',
  'drop',
  'bolt',
  'flower',
] as const;
export type Face = (typeof PAIR_FACES)[number];

/** 12 cards: 6 faces twice, shuffled. */
export function dealPairs(seed: number, pairs = PAIRS): Face[] {
  const rand = rng(seed);
  const faces = shuffle(PAIR_FACES, rand).slice(0, pairs);
  return shuffle([...faces, ...faces], rand);
}

export function pairsStars(found: number, moves: number, pairs = PAIRS): 1 | 2 | 3 {
  if (found < pairs) return 1;
  return moves <= 8 ? 3 : 2;
}

// ───────────────────────── Stack tower ─────────────────────────

export const STACK_FLOORS = 14;
export const PERFECT_PX = 3;

/** Ping-pong position of the sliding slab: 0 … range, `speed` px per ms. */
export function slidePos(tMs: number, speed: number, range: number): number {
  if (range <= 0) return 0;
  const d = (tMs * speed) % (2 * range);
  return d <= range ? d : 2 * range - d;
}

export type Drop = { left: number; width: number; cut: number; perfect: boolean };

/** Dropping a slab of `width` at `left` on a top floor (`baseLeft`, `width`). */
export function dropSlab(baseLeft: number, baseWidth: number, left: number): Drop {
  if (Math.abs(left - baseLeft) <= PERFECT_PX)
    return { left: baseLeft, width: baseWidth, cut: 0, perfect: true };
  const l = Math.max(baseLeft, left);
  const r = Math.min(baseLeft + baseWidth, left + baseWidth);
  const width = Math.max(0, r - l);
  return { left: l, width, cut: baseWidth - width, perfect: false };
}

/** Slab speed (px per ms) for floor n, a little faster each floor. */
export function slabSpeed(floor: number): number {
  return 0.16 + floor * 0.012;
}

export function stackStars(floors: number): 1 | 2 | 3 {
  return floors >= 13 ? 3 : floors >= 6 ? 2 : 1;
}

// ───────────────────────── Rocket hop ─────────────────────────

export const HOP_GOAL = 6;
export const HOP_LIVES = 3;
export const SWING_PERIOD_MS = 2600;
export const FLIGHT_MS = 600;
/** Landing window: planet centre within this many px of the rocket. */
export const LAND_TOLERANCE = 30;

export function planetX(tMs: number, centre: number, amplitude: number, phase = 0): number {
  return centre + amplitude * Math.sin(phase + (2 * Math.PI * tMs) / SWING_PERIOD_MS);
}

export function hopPoints(offset: number): number {
  return 20 + Math.max(0, 40 - Math.round(Math.abs(offset)));
}

export function hopStars(hops: number, lives: number): 1 | 2 | 3 {
  if (hops >= HOP_GOAL && lives === HOP_LIVES) return 3;
  return hops >= 3 ? 2 : 1;
}

// ───────────────────────── Lane dash ─────────────────────────

export const LANES = 3;
export type LaneItem = { at: number; lane: number; kind: 'block' | 'gem' };

/**
 * Rows of falling things for a 30 s round, closer together as it speeds up. A row never blocks
 * all three lanes, so there is always a way through.
 */
export function laneSchedule(seed: number, durationMs = 30_000): LaneItem[] {
  const rand = rng(seed);
  const items: LaneItem[] = [];
  let at = 900;
  while (at < durationMs - 600) {
    const blocks = rand() < 0.35 ? 2 : 1;
    const lanes = shuffle([0, 1, 2], rand);
    for (let i = 0; i < blocks; i++) items.push({ at, lane: lanes[i]!, kind: 'block' });
    if (rand() < 0.6) items.push({ at, lane: lanes[2]!, kind: 'gem' });
    at += Math.round(Math.max(420, 900 - (at / durationMs) * 480) + rand() * 120);
  }
  return items;
}

/** Fall time from top to the runner, shorter as the round goes on. */
export function fallMs(atMs: number, durationMs = 30_000): number {
  return Math.round(1700 - (atMs / durationMs) * 700);
}

export function laneStars(hits: number): 1 | 2 | 3 {
  return hits === 0 ? 3 : hits < 3 ? 2 : 1;
}

// ───────────────────────── Block fit ─────────────────────────

export const FIT_SIZE = 8;
export type Cell = [number, number];
export type Piece = { id: string; cells: Cell[] };

/** Piece shapes as [row, col] offsets. */
export const PIECES: readonly Piece[] = [
  { id: 'dot', cells: [[0, 0]] },
  {
    id: 'i2',
    cells: [
      [0, 0],
      [0, 1],
    ],
  },
  {
    id: 'i2v',
    cells: [
      [0, 0],
      [1, 0],
    ],
  },
  {
    id: 'i3',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
  },
  {
    id: 'i3v',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  },
  {
    id: 'sq',
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  },
  {
    id: 'l3',
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
    ],
  },
  {
    id: 'j3',
    cells: [
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  },
  {
    id: 'l4',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ],
  },
  {
    id: 't4',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
    ],
  },
  {
    id: 'i4',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ],
  },
];

export type Board = boolean[][];

export function emptyBoard(n = FIT_SIZE): Board {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => false));
}

export function canPlace(b: Board, p: Piece, r: number, c: number): boolean {
  return p.cells.every(([dr, dc]) => {
    const rr = r + dr;
    const cc = c + dc;
    return rr >= 0 && cc >= 0 && rr < b.length && cc < b.length && !b[rr]![cc];
  });
}

/** Places the piece and clears full rows and columns. */
export function place(b: Board, p: Piece, r: number, c: number): { board: Board; lines: number } {
  const next = b.map((row) => [...row]);
  for (const [dr, dc] of p.cells) next[r + dr]![c + dc] = true;
  const n = next.length;
  const rows = next.map((row, i) => (row.every(Boolean) ? i : -1)).filter((i) => i >= 0);
  const cols = Array.from({ length: n }, (_, j) => j).filter((j) => next.every((row) => row[j]));
  for (const i of rows) next[i] = next[i]!.map(() => false);
  for (const j of cols) for (const row of next) row[j] = false;
  return { board: next, lines: rows.length + cols.length };
}

export function fitsAnywhere(b: Board, p: Piece): boolean {
  for (let r = 0; r < b.length; r++)
    for (let c = 0; c < b.length; c++) if (canPlace(b, p, r, c)) return true;
  return false;
}

/** A tray of three pieces; at least one fits the board when anything can. */
export function makeTray(rand: () => number, b: Board): Piece[] {
  const tray = [pick(PIECES, rand), pick(PIECES, rand), pick(PIECES, rand)];
  if (!tray.some((p) => fitsAnywhere(b, p))) {
    const fitting = PIECES.filter((p) => fitsAnywhere(b, p));
    if (fitting.length) tray[randInt(rand, 3)] = pick(fitting, rand);
  }
  return tray;
}

export function fitStars(lines: number, misfits: number): 1 | 2 | 3 {
  if (lines === 0) return 1;
  return misfits ? 2 : 3;
}

// ───────────────────────── Calm games ─────────────────────────

export const BREATHS = 9;
export const BREATH_IN_MS = 4000;
export const BREATH_OUT_MS = 6000;

/** Which breath and phase at game time t (9 × (4 s in + 6 s out) = 90 s). */
export function breathAt(tMs: number): {
  index: number;
  phase: 'in' | 'out';
  p: number;
  done: boolean;
} {
  const cycle = BREATH_IN_MS + BREATH_OUT_MS;
  const index = Math.floor(tMs / cycle);
  if (index >= BREATHS) return { index: BREATHS, phase: 'out', p: 1, done: true };
  const within = tMs - index * cycle;
  return within < BREATH_IN_MS
    ? { index, phase: 'in', p: within / BREATH_IN_MS, done: false }
    : { index, phase: 'out', p: (within - BREATH_IN_MS) / BREATH_OUT_MS, done: false };
}

export const SILENCE_MINUTES = [2, 3, 5] as const;

export const URGE_MS = 75_000;
/** Wave height 0–1 over the urge: rises to a peak at 40 %, then eases away. */
export function urgeLevel(tMs: number, totalMs = URGE_MS): number {
  const x = Math.min(1, Math.max(0, tMs / totalMs));
  return x < 0.4
    ? Math.sin((x / 0.4) * (Math.PI / 2))
    : Math.cos(((x - 0.4) / 0.6) * (Math.PI / 2));
}

export function urgeStage(
  tMs: number,
  totalMs = URGE_MS,
): 'notice' | 'rising' | 'peak' | 'falling' | 'gone' {
  const x = tMs / totalMs;
  if (x < 0.12) return 'notice';
  if (x < 0.34) return 'rising';
  if (x < 0.5) return 'peak';
  if (x < 0.9) return 'falling';
  return 'gone';
}
