import {
  angleDiff,
  BLOCK_HALF,
  hitsBlock,
  lapLayout,
  orbitStars,
  ORBIT_SPEED,
  START_ANGLE,
  START_RING,
  type Ring,
} from '../logic';

describe('Orbit switch', () => {
  it('always leaves a way through, over 1,000 seeds and 8 laps', () => {
    for (let seed = 0; seed < 1000; seed++) {
      for (let laps = 0; laps < 8; laps++) {
        const { blocks, sparks } = lapLayout(seed, laps);
        expect(blocks).toHaveLength(Math.min(4, 2 + laps));
        expect(sparks).toHaveLength(blocks.length);
        // The start is free on both rings.
        expect(hitsBlock(START_ANGLE, 0, blocks)).toBe(false);
        expect(hitsBlock(START_ANGLE, 1, blocks)).toBe(false);
        // At every angle at least one ring is open.
        for (let a = 0; a < Math.PI * 2; a += 0.02) {
          const both = ([0, 1] as Ring[]).every((r) => hitsBlock(a, r, blocks));
          expect(both).toBe(false);
        }
        // Consecutive blocks are far enough apart to switch between them.
        for (let i = 1; i < blocks.length; i++) {
          expect(Math.abs(angleDiff(blocks[i]!.a, blocks[i - 1]!.a))).toBeGreaterThan(
            BLOCK_HALF * 2,
          );
        }
      }
    }
  });

  it('gives the starting ring at least 1.5 s before its first block, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const { blocks } = lapLayout(seed, 0);
      const first = Math.min(
        ...blocks.filter((b) => b.ring === START_RING).map((b) => b.a - BLOCK_HALF - START_ANGLE),
      );
      expect(first / ORBIT_SPEED).toBeGreaterThan(1.5);
    }
  });

  it('wraps angle differences', () => {
    expect(angleDiff(0.1, Math.PI * 2 - 0.1)).toBeCloseTo(0.2);
    expect(angleDiff(Math.PI * 2 - 0.1, 0.1)).toBeCloseTo(-0.2);
  });

  it('keeps the prototype star rule', () => {
    expect(orbitStars(0, 3)).toBe(3);
    expect(orbitStars(2, 1)).toBe(2);
    expect(orbitStars(3, 0)).toBe(1);
  });
});
