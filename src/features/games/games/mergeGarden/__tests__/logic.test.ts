import { rng } from '@/lib/rng';

import {
  canMerge,
  FLOWER,
  GARDEN_CELLS,
  GARDEN_GOAL,
  GARDEN_START_PLANTS,
  gardenPoints,
  gardenStars,
  hasMerge,
  mergeAt,
  pairAt,
  plantCount,
  SEED,
  spawnSeeds,
  SPROUT,
  startGarden,
  type Level,
} from '../logic';

/** Plays one garden to the goal with `choose` picking each move; returns the moves taken. */
function play(seed: number, choose: (cells: Level[]) => [number, number], limit: number) {
  let { cells, rand } = startGarden(seed);
  let flowers = 0;
  let moves = 0;
  while (flowers < GARDEN_GOAL && moves < limit) {
    expect(hasMerge(cells)).toBe(true);
    const [from, to] = choose(cells);
    const m = mergeAt(cells, from, to);
    moves++;
    if (m.flower) flowers++;
    const s = spawnSeeds(m.cells, rand);
    cells = s.cells;
    expect(plantCount(cells)).toBeLessThanOrEqual(GARDEN_START_PLANTS);
  }
  return { flowers, moves };
}

const greedy = (cells: Level[]) => pairAt(cells)!;

function randomMove(seed: number) {
  const rand = rng(seed ^ 0x5eed);
  return (cells: Level[]): [number, number] => {
    const pairs: [number, number][] = [];
    for (let a = 0; a < cells.length; a++)
      for (let b = 0; b < cells.length; b++) if (canMerge(cells, a, b)) pairs.push([a, b]);
    return pairs[Math.floor(rand() * pairs.length)]!;
  };
}

describe('Merge garden', () => {
  it('starts with 8 planted wells, one sprout, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const { cells } = startGarden(seed);
      expect(cells).toHaveLength(GARDEN_CELLS);
      expect(plantCount(cells)).toBe(GARDEN_START_PLANTS);
      expect(cells.filter((l) => l === SPROUT)).toHaveLength(1);
      expect(cells.filter((l) => l === SEED)).toHaveLength(GARDEN_START_PLANTS - 1);
      expect(hasMerge(cells)).toBe(true);
    }
  });

  it('is deterministic per seed', () => {
    expect(startGarden(42).cells).toEqual(startGarden(42).cells);
    const a = startGarden(7);
    const b = startGarden(7);
    expect(a.rand()).toBe(b.rand());
  });

  it('only merges matching seeds or sprouts', () => {
    const cells: Level[] = [1, 1, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(canMerge(cells, 0, 1)).toBe(true);
    expect(canMerge(cells, 2, 4)).toBe(true);
    expect(canMerge(cells, 0, 2)).toBe(false);
    expect(canMerge(cells, 0, 3)).toBe(false);
    expect(canMerge(cells, 3, 5)).toBe(false);
    expect(canMerge(cells, 0, 0)).toBe(false);
    expect(canMerge(cells, 0, 16)).toBe(false);
    expect(() => mergeAt(cells, 0, 2)).toThrow();
  });

  it('grows the target well, empties the source, and sends flowers to the goal', () => {
    const cells: Level[] = [1, 1, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const s = mergeAt(cells, 0, 1);
    expect(s.level).toBe(SPROUT);
    expect(s.flower).toBe(false);
    expect(s.cells[0]).toBe(0);
    expect(s.cells[1]).toBe(SPROUT);
    const f = mergeAt(cells, 2, 4);
    expect(f.level).toBe(FLOWER);
    expect(f.flower).toBe(true);
    expect(f.cells[2]).toBe(0);
    expect(f.cells[4]).toBe(0);
    expect(cells[0]).toBe(1);
  });

  it('drops one seed into an empty well after a move', () => {
    const cells: Level[] = [0, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const s = spawnSeeds(cells, rng(3));
    expect(s.spawned).toHaveLength(1);
    expect(cells[s.spawned[0]!]).toBe(0);
    expect(s.cells[s.spawned[0]!]).toBe(SEED);
  });

  it('drops extra seeds until a pair exists (no dead plots)', () => {
    for (let seed = 0; seed < 200; seed++) {
      const cells: Level[] = Array.from({ length: GARDEN_CELLS }, () => 0);
      const s = spawnSeeds(cells, rng(seed));
      expect(hasMerge(s.cells)).toBe(true);
      const lonely: Level[] = [2, ...Array.from({ length: GARDEN_CELLS - 1 }, (): Level => 0)];
      expect(hasMerge(spawnSeeds(lonely, rng(seed)).cells)).toBe(true);
    }
  });

  it('a greedy gardener grows 3 flowers within the 3-star moves, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const r = play(seed, greedy, 50);
      expect(r.flowers).toBe(GARDEN_GOAL);
      expect(r.moves).toBeLessThanOrEqual(10);
      expect(gardenStars(r.flowers, r.moves)).toBe(3);
    }
  });

  it('random valid play never gets stuck and still finishes, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const r = play(seed, randomMove(seed), 400);
      expect(r.flowers).toBe(GARDEN_GOAL);
    }
  });

  it('keeps the prototype points and star rule', () => {
    expect(gardenPoints(SPROUT)).toBe(10);
    expect(gardenPoints(FLOWER)).toBe(40);
    expect(gardenStars(3, 9)).toBe(3);
    expect(gardenStars(3, 10)).toBe(3);
    expect(gardenStars(3, 11)).toBe(2);
    expect(gardenStars(2, 5)).toBe(1);
    expect(gardenStars(0, 0)).toBe(1);
  });
});
