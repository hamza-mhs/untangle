import { pick, rng, shuffle } from '@/lib/rng';

/** Merge garden rules (prototype `_g2b1.js` › Merge garden). */
export const GARDEN_COLS = 4;
export const GARDEN_CELLS = GARDEN_COLS * GARDEN_COLS;
export const GARDEN_START_PLANTS = 8;
/** The prototype only drops a new seed while fewer than 9 wells are planted. */
export const GARDEN_SPAWN_BELOW = 9;
export const GARDEN_GOAL = 3;
export const GARDEN_SECONDS = 45;
/** Three stars for a full garden in this many moves or fewer. */
export const GARDEN_STAR_MOVES = 10;
export const SPROUT_POINTS = 10;
export const FLOWER_POINTS = 40;

/** 0 empty well, 1 seed, 2 sprout, 3 flower (flowers leave the plot straight away). */
export type Level = 0 | 1 | 2 | 3;
export const SEED: Level = 1;
export const SPROUT: Level = 2;
export const FLOWER: Level = 3;

/** The opening plot: 8 random wells filled, one of them a sprout. `rand` keeps going for spawns. */
export function startGarden(seed: number): { cells: Level[]; rand: () => number } {
  const rand = rng(seed);
  const cells: Level[] = Array.from({ length: GARDEN_CELLS }, () => 0);
  shuffle([...Array(GARDEN_CELLS).keys()], rand)
    .slice(0, GARDEN_START_PLANTS)
    .forEach((i, k) => {
      cells[i] = k === 0 ? SPROUT : SEED;
    });
  return { cells, rand };
}

/** A plant merges onto another well holding the same kind of plant. */
export function canMerge(cells: readonly Level[], from: number, to: number): boolean {
  if (from === to || from < 0 || to < 0 || from >= cells.length || to >= cells.length) return false;
  const l = cells[from]!;
  return l > 0 && l < FLOWER && cells[to] === l;
}

/**
 * Merges `from` onto `to`: the source well empties and the target grows one level. A flower
 * flies to the goal row, so its well empties too (`flower: true`).
 */
export function mergeAt(
  cells: readonly Level[],
  from: number,
  to: number,
): { cells: Level[]; level: Level; flower: boolean } {
  if (!canMerge(cells, from, to)) throw new Error(`Not a merge: ${from} → ${to}`);
  const next = [...cells];
  const level = (cells[to]! + 1) as Level;
  next[from] = 0;
  next[to] = level === FLOWER ? 0 : level;
  return { cells: next, level, flower: level === FLOWER };
}

export function plantCount(cells: readonly Level[]): number {
  return cells.filter((l) => l > 0).length;
}

function emptyWells(cells: readonly Level[]): number[] {
  return cells.flatMap((l, i) => (l === 0 ? [i] : []));
}

/** Any two plants of the same kind left on the plot. */
export function hasMerge(cells: readonly Level[]): boolean {
  return pairAt(cells) !== null;
}

/** The prototype's pick: the first pair at the highest level (sprouts before seeds). */
export function pairAt(cells: readonly Level[]): [number, number] | null {
  for (const l of [SPROUT, SEED]) {
    const idx = cells.flatMap((v, i) => (v === l ? [i] : []));
    if (idx.length >= 2) return [idx[0]!, idx[1]!];
  }
  return null;
}

/**
 * After every move a new seed drops into a random empty well (prototype: only while fewer than
 * 9 wells are planted). If the plot is ever left without a pair, more seeds drop until there is
 * one, so the garden can't get stuck. Returns the wells that were planted, in order.
 */
export function spawnSeeds(
  cells: readonly Level[],
  rand: () => number,
): { cells: Level[]; spawned: number[] } {
  const next = [...cells];
  const spawned: number[] = [];
  const drop = () => {
    const e = emptyWells(next);
    if (!e.length) return false;
    const i = pick(e, rand);
    next[i] = SEED;
    spawned.push(i);
    return true;
  };
  if (plantCount(next) < GARDEN_SPAWN_BELOW) drop();
  while (!hasMerge(next) && drop()) {
    // Rescue: keep dropping seeds until a pair exists.
  }
  return { cells: next, spawned };
}

export function gardenPoints(level: Level): number {
  return level === FLOWER ? FLOWER_POINTS : SPROUT_POINTS;
}

/** Prototype: 3 flowers in ≤ 10 moves for 3 stars, 3 flowers for 2, otherwise 1. */
export function gardenStars(flowers: number, moves: number): 1 | 2 | 3 {
  if (flowers < GARDEN_GOAL) return 1;
  return moves <= GARDEN_STAR_MOVES ? 3 : 2;
}
