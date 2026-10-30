import { pickUnplayed, servableItems } from '../content';

const items = Array.from({ length: 10 }, (_, i) => ({ id: `x-${i}` }));

describe('pickUnplayed', () => {
  it('never serves a recent item while fresh ones remain, over 1,000 seeds', () => {
    const recent = ['x-1', 'x-3', 'x-5', 'x-7'];
    for (let seed = 0; seed < 1000; seed++) {
      const got = pickUnplayed(items, recent, seed, 3);
      expect(got).toHaveLength(3);
      expect(new Set(got.map((g) => g.id)).size).toBe(3);
      for (const g of got) expect(recent).not.toContain(g.id);
    }
  });

  it('is deterministic per seed', () => {
    expect(pickUnplayed(items, [], 42, 4)).toEqual(pickUnplayed(items, [], 42, 4));
  });

  it('falls back to the items played longest ago', () => {
    // Newest first: x-9 is the most recent, x-0 the oldest.
    const recent = items.map((it) => it.id).reverse();
    expect(pickUnplayed(items, recent, 1, 2).map((g) => g.id)).toEqual(['x-0', 'x-1']);
  });

  it('caps at the pack size', () => {
    expect(pickUnplayed(items.slice(0, 2), [], 3, 5)).toHaveLength(2);
  });
});

describe('servableItems', () => {
  const pack = { version: 1, items: [{ id: 'a' }, { id: 'b', reviewed: false }] };

  it('serves everything in dev builds', () => {
    expect(servableItems({ ...pack, reviewed: false }, true)).toHaveLength(2);
  });

  it('hides unreviewed packs and items in release builds', () => {
    expect(servableItems({ ...pack, reviewed: false }, false)).toEqual([]);
    expect(servableItems(pack, false).map((i) => i.id)).toEqual(['a']);
  });
});
