import { rng } from '@/lib/rng';

import {
  arrowStars,
  arrowTrials,
  averageMs,
  breathAt,
  canPlace,
  colourStars,
  colourTrials,
  dealPairs,
  dropSlab,
  echoIsMatch,
  echoSequence,
  ECHO_MATCHES,
  emptyBoard,
  fitsAnywhere,
  fitStars,
  hopPoints,
  hopStars,
  INKS,
  laneSchedule,
  laneStars,
  makeTray,
  pairsStars,
  PIECES,
  place,
  planetX,
  popSchedule,
  redStars,
  slidePos,
  stackStars,
  TAP_COLS,
  TAP_ROWS,
  urgeLevel,
  urgeStage,
} from '../logic';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 13);

describe('Colour word', () => {
  it('makes 14 valid, mostly incongruent trials for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const trials = colourTrials(s);
      expect(trials).toHaveLength(14);
      for (const tr of trials) {
        expect(INKS).toContain(tr.ink);
        expect(INKS).toContain(tr.word);
      }
      expect(trials.filter((tr) => tr.word !== tr.ink).length).toBeGreaterThanOrEqual(6);
    }
  });
  it('stars', () => {
    expect([colourStars(13), colourStars(9), colourStars(8)]).toEqual([3, 2, 1]);
  });
});

describe('Middle arrow', () => {
  it('half congruent for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const tr = arrowTrials(s);
      expect(tr).toHaveLength(20);
      expect(tr.filter((x) => x.flank === x.middle)).toHaveLength(10);
    }
  });
  it('average and stars', () => {
    expect(averageMs([400, 500, 600])).toBe(500);
    expect(averageMs([])).toBe(0);
    expect([arrowStars(15), arrowStars(10), arrowStars(3)]).toEqual([3, 2, 1]);
  });
});

describe("Don't tap red", () => {
  it('never puts two live shapes in one cell, for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const pops = popSchedule(s);
      expect(pops.length).toBeGreaterThan(30);
      for (const p of pops) {
        expect(p.cell).toBeGreaterThanOrEqual(0);
        expect(p.cell).toBeLessThan(TAP_COLS * TAP_ROWS);
        const clash = pops.filter(
          (q) => q !== p && q.cell === p.cell && q.at < p.at + p.ttl && p.at < q.at + q.ttl,
        );
        expect(clash).toHaveLength(0);
      }
      const red = pops.filter((p) => p.red).length / pops.length;
      expect(red).toBeGreaterThan(0.08);
      expect(red).toBeLessThan(0.5);
    }
  });
  it('stars', () => {
    expect([redStars(20, 0), redStars(20, 2), redStars(3, 0)]).toEqual([3, 2, 1]);
  });
});

describe('Echo', () => {
  it('has exactly 5 two-back matches for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const seq = echoSequence(s);
      expect(seq).toHaveLength(16);
      expect(seq.filter((_, i) => echoIsMatch(seq, i))).toHaveLength(ECHO_MATCHES);
      expect(echoIsMatch(seq, 0)).toBe(false);
      expect(echoIsMatch(seq, 1)).toBe(false);
    }
  });
});

describe('Card pairs', () => {
  it('deals six pairs for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const deck = dealPairs(s);
      expect(deck).toHaveLength(12);
      const counts = new Map<string, number>();
      for (const f of deck) counts.set(f, (counts.get(f) ?? 0) + 1);
      expect([...counts.values()].every((n) => n === 2)).toBe(true);
    }
  });
  it('stars', () => {
    expect([pairsStars(6, 8), pairsStars(6, 12), pairsStars(4, 6)]).toEqual([3, 2, 1]);
  });
});

describe('Stack tower', () => {
  it('slides back and forth', () => {
    expect(slidePos(0, 0.2, 100)).toBe(0);
    expect(slidePos(500, 0.2, 100)).toBe(100);
    expect(slidePos(750, 0.2, 100)).toBe(50);
    expect(slidePos(1000, 0.2, 100)).toBe(0);
  });
  it('perfect drops keep the width, others cut the overhang', () => {
    expect(dropSlab(50, 160, 52)).toEqual({ left: 50, width: 160, cut: 0, perfect: true });
    expect(dropSlab(50, 160, 70)).toEqual({ left: 70, width: 140, cut: 20, perfect: false });
    expect(dropSlab(50, 160, 30)).toEqual({ left: 50, width: 140, cut: 20, perfect: false });
    expect(dropSlab(50, 160, 300).width).toBe(0);
  });
  it('stars', () => {
    expect([stackStars(13), stackStars(8), stackStars(2)]).toEqual([3, 2, 1]);
  });
});

describe('Rocket hop', () => {
  it('swings around the centre', () => {
    expect(planetX(0, 132, 88)).toBeCloseTo(132);
    expect(planetX(650, 132, 88)).toBeCloseTo(220);
  });
  it('points and stars', () => {
    expect(hopPoints(0)).toBe(60);
    expect(hopPoints(50)).toBe(20);
    expect([hopStars(6, 3), hopStars(6, 2), hopStars(2, 3)]).toEqual([3, 2, 1]);
  });
});

describe('Lane dash', () => {
  it('always leaves a free lane, for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const items = laneSchedule(s);
      const rows = new Map<number, Set<number>>();
      for (const it of items.filter((i) => i.kind === 'block')) {
        const set = rows.get(it.at) ?? new Set();
        set.add(it.lane);
        rows.set(it.at, set);
      }
      for (const lanes of rows.values()) expect(lanes.size).toBeLessThan(3);
      const gemsOnBlocks = items.filter((g) => g.kind === 'gem' && rows.get(g.at)?.has(g.lane));
      expect(gemsOnBlocks).toHaveLength(0);
    }
  });
  it('stars', () => {
    expect([laneStars(0), laneStars(2), laneStars(5)]).toEqual([3, 2, 1]);
  });
});

describe('Block fit', () => {
  it('places pieces and clears full lines', () => {
    let b = emptyBoard();
    const i4 = PIECES.find((p) => p.id === 'i4')!;
    b = place(b, i4, 0, 0).board;
    expect(canPlace(b, i4, 0, 0)).toBe(false);
    const r = place(b, i4, 0, 4);
    expect(r.lines).toBe(1);
    expect(r.board[0]!.every((x) => !x)).toBe(true);
  });
  it('rejects off-board placements', () => {
    const sq = PIECES.find((p) => p.id === 'sq')!;
    expect(canPlace(emptyBoard(), sq, 7, 7)).toBe(false);
    expect(canPlace(emptyBoard(), sq, 6, 6)).toBe(true);
  });
  it('a fresh tray always has a piece that fits, for 1,000 seeds', () => {
    for (const s of SEEDS) {
      const rand = rng(s);
      // A crowded board: random filled cells, then a tray.
      let b = emptyBoard();
      for (let k = 0; k < 40; k++) {
        const p = PIECES[Math.floor(rand() * PIECES.length)]!;
        const r = Math.floor(rand() * 8);
        const c = Math.floor(rand() * 8);
        if (canPlace(b, p, r, c)) b = place(b, p, r, c).board;
      }
      const tray = makeTray(rand, b);
      const anyFits = PIECES.some((p) => fitsAnywhere(b, p));
      if (anyFits) expect(tray.some((p) => fitsAnywhere(b, p))).toBe(true);
    }
  });
  it('stars', () => {
    expect([fitStars(4, 0), fitStars(4, 1), fitStars(0, 0)]).toEqual([3, 2, 1]);
  });
});

describe('Calm games', () => {
  it('nine breaths of 4 s in and 6 s out', () => {
    expect(breathAt(0)).toMatchObject({ index: 0, phase: 'in' });
    expect(breathAt(4500)).toMatchObject({ index: 0, phase: 'out' });
    expect(breathAt(10_000)).toMatchObject({ index: 1, phase: 'in' });
    expect(breathAt(90_000).done).toBe(true);
  });
  it('the urge rises, peaks and passes', () => {
    expect(urgeLevel(0)).toBeCloseTo(0);
    expect(urgeLevel(30_000)).toBeCloseTo(1);
    expect(urgeLevel(75_000)).toBeCloseTo(0);
    expect(urgeStage(0)).toBe('notice');
    expect(urgeStage(33_000)).toBe('peak');
    expect(urgeStage(74_000)).toBe('gone');
  });
});
