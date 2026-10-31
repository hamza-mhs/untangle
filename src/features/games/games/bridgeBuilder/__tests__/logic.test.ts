import {
  beamDip,
  BRIDGE_COUNT,
  bridgeLevel,
  bridgeStars,
  deckUnits,
  DECK_MAX_UNITS,
  DECK_MIN_UNITS,
  fits,
  GAP_MAX,
  GAP_MIN,
  hitRect,
  misfitKind,
  nearestGap,
  trayLayout,
  waveAngle,
} from '../logic';

const sorted = (a: number[]) => [...a].sort((x, y) => x - y);

describe('Bridge builder', () => {
  it('builds solvable bridges over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      for (let i = 0; i < BRIDGE_COUNT; i++) {
        const { gaps, tray } = bridgeLevel(seed, i);
        expect(gaps.length).toBeGreaterThanOrEqual(2);
        expect(gaps.length).toBeLessThanOrEqual(4);
        expect(gaps.every((g) => g >= GAP_MIN && g <= GAP_MAX)).toBe(true);
        const units = deckUnits({ gaps, tray });
        expect(units).toBeGreaterThanOrEqual(DECK_MIN_UNITS);
        expect(units).toBeLessThanOrEqual(DECK_MAX_UNITS);

        // The fitting beams are exactly the gaps' lengths: every gap has its own beam.
        const fitting = tray.filter((b) => gaps.includes(b));
        expect(sorted(fitting)).toEqual(sorted(gaps));
        // 1–2 decoys, and no decoy fits any gap, so the assignment can't go wrong.
        const decoys = tray.filter((b) => !gaps.includes(b));
        expect(decoys.length).toBeGreaterThanOrEqual(1);
        expect(decoys.length).toBeLessThanOrEqual(2);
        expect(decoys.every((d) => d >= 1 && gaps.every((g) => !fits(d, g)))).toBe(true);
        // Greedy filling always completes: any fitting beam picked for any gap leaves a beam
        // for every other gap.
        const left = [...tray];
        for (const g of gaps) {
          const k = left.findIndex((b) => fits(b, g));
          expect(k).toBeGreaterThanOrEqual(0);
          left.splice(k, 1);
        }
        expect(sorted(left)).toEqual(sorted(decoys));
      }
    }
  });

  it('gets busier through the round and is deterministic per seed', () => {
    for (let seed = 0; seed < 200; seed++) {
      expect(bridgeLevel(seed, 0).gaps.length).toBeLessThanOrEqual(3);
      expect(bridgeLevel(seed, 1).gaps.length).toBe(3);
      expect(bridgeLevel(seed, 2).gaps.length).toBeGreaterThanOrEqual(3);
    }
    expect(bridgeLevel(42, 1)).toEqual(bridgeLevel(42, 1));
    const differs = Array.from({ length: 20 }, (_, s) => bridgeLevel(s, 0)).some(
      (l) => JSON.stringify(l) !== JSON.stringify(bridgeLevel(0, 0)),
    );
    expect(differs).toBe(true);
  });

  it('fits only exact lengths', () => {
    expect(fits(3, 3)).toBe(true);
    expect(fits(2, 3)).toBe(false);
    expect(misfitKind(2, 3)).toBe('short');
    expect(misfitKind(4, 3)).toBe('long');
  });

  it('lays the tray out in rows that fit the width', () => {
    const { pos, rows } = trayLayout([3, 4, 2, 5, 1], 20, 200, 10, 30);
    expect(rows).toBe(2);
    expect(pos[0]).toEqual({ x: 0, y: 0 });
    expect(pos[1]).toEqual({ x: 70, y: 0 });
    expect(pos[2]).toEqual({ x: 160, y: 0 });
    expect(pos[3]).toEqual({ x: 0, y: 30 });
    pos.forEach((p, i) => expect(p.x + [3, 4, 2, 5, 1][i]! * 20).toBeLessThanOrEqual(200));
    expect(trayLayout([], 20, 200, 10, 30).rows).toBe(0);
  });

  it('every generated tray fits the tray width at the round unit', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const { tray } = bridgeLevel(seed, seed % BRIDGE_COUNT);
      const { pos, rows } = trayLayout(tray, 22, 300, 8, 30);
      expect(rows).toBeLessThanOrEqual(3);
      pos.forEach((p, i) => expect(p.x + tray[i]! * 22).toBeLessThanOrEqual(300));
    }
  });

  it('drops onto the nearest open gap within reach', () => {
    const slots = [
      { x: 0, y: 0, w: 40, h: 10 },
      { x: 40, y: 0, w: 60, h: 10 },
    ];
    expect(nearestGap(slots, [false, false], 25, 5, 50)).toBe(0);
    expect(nearestGap(slots, [false, false], 65, 8, 50)).toBe(1);
    expect(nearestGap(slots, [true, false], 25, 5, 60)).toBe(1);
    expect(nearestGap(slots, [false, false], 25, 300, 50)).toBe(-1);
    expect(nearestGap(slots, [true, true], 25, 5, 50)).toBe(-1);
  });

  it('hit-tests rects with slop', () => {
    const rects = [{ x: 10, y: 10, w: 20, h: 10 }];
    expect(hitRect(rects, 15, 15)).toBe(0);
    expect(hitRect(rects, 15, 25)).toBe(-1);
    expect(hitRect(rects, 15, 25, 6)).toBe(0);
  });

  it('dips the beam under Pip only', () => {
    expect(beamDip(5, 10, 20, 3)).toBe(0);
    expect(beamDip(20, 10, 20, 3)).toBeCloseTo(3);
    expect(beamDip(35, 10, 20, 3)).toBe(0);
  });

  it('keeps the prototype top star rule', () => {
    expect(bridgeStars(3, 0)).toBe(3);
    expect(bridgeStars(3, 2)).toBe(2);
    expect(bridgeStars(1, 0)).toBe(3);
    expect(bridgeStars(0, 0)).toBe(1);
  });
});

describe('Pip wave', () => {
  it('follows the prototype keyframes and rests at 0', () => {
    expect(waveAngle(0)).toBe(0);
    expect(waveAngle(0.25)).toBeCloseTo(-25);
    expect(waveAngle(0.5)).toBeCloseTo(10);
    expect(waveAngle(0.125)).toBeCloseTo(-12.5);
    expect(waveAngle(1)).toBe(0);
  });
});
