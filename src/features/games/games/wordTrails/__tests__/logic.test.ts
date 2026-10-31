import {
  beadPoints,
  judgeWord,
  packTray,
  slideBead,
  tapBead,
  trailStars,
  trayOrder,
  trayWell,
  wordPoints,
  wordWidth,
} from '../logic';

/** Feeds bead indices through `slideBead` and returns the final path and the steps. */
function slide(seq: number[]) {
  let path: number[] = [];
  const steps = seq.map((i) => {
    const r = slideBead(path, i);
    path = r.path;
    return r.step;
  });
  return { path, steps };
}

describe('slideBead', () => {
  it('adds new beads in order', () => {
    expect(slide([0, 1, 2, 3])).toEqual({
      path: [0, 1, 2, 3],
      steps: ['start', 'add', 'add', 'add'],
    });
  });

  it('sliding back onto the previous bead removes the last letter', () => {
    expect(slide([0, 1, 2, 1])).toEqual({ path: [0, 1], steps: ['start', 'add', 'add', 'back'] });
    expect(slide([0, 1, 0]).path).toEqual([0]);
  });

  it('uses each bead at most once and ignores older beads', () => {
    expect(slide([0, 1, 2, 0]).path).toEqual([0, 1, 2]);
    expect(slideBead([0, 1, 2], 0).step).toBe('same');
    expect(slideBead([0, 1, 2], 2).step).toBe('same');
  });

  it('does not mutate the input path', () => {
    const p = [0, 1];
    slideBead(p, 2);
    slideBead(p, 0);
    expect(p).toEqual([0, 1]);
  });
});

describe('tapBead', () => {
  it('starts, adds, and tries on the last bead again', () => {
    expect(tapBead([], 3)).toEqual({ path: [3], step: 'start' });
    expect(tapBead([3], 4)).toEqual({ path: [3, 4], step: 'add' });
    expect(tapBead([3, 4], 4)).toEqual({ path: [3, 4], step: 'try' });
  });

  it('an earlier bead of the word cuts the word back to it', () => {
    expect(tapBead([0, 1, 2, 3], 1)).toEqual({ path: [0, 1], step: 'back' });
    expect(tapBead([0, 1, 2], 0)).toEqual({ path: [0], step: 'back' });
  });
});

describe('judgeWord', () => {
  const tray = ['calm', 'meal', 'came', 'medal', 'camel'];
  it('tells a new tray word, a repeat and a miss apart', () => {
    expect(judgeWord('calm', tray, [])).toBe('found');
    expect(judgeWord('calm', tray, ['calm'])).toBe('again');
    expect(judgeWord('clad', tray, ['calm'])).toBe('miss');
    expect(judgeWord('ca', tray, [])).toBe('miss');
  });
});

describe('scoring and stars', () => {
  it('scores 10 per letter', () => {
    expect(wordPoints('calm')).toBe(40);
    expect(wordPoints('camel')).toBe(50);
  });

  it('3 stars for all five, 2 for some, 1 for none', () => {
    expect(trailStars(5)).toBe(3);
    expect(trailStars(4)).toBe(2);
    expect(trailStars(1)).toBe(2);
    expect(trailStars(0)).toBe(1);
  });
});

describe('tray layout', () => {
  it('sorts words by length, then alphabetically', () => {
    expect(trayOrder(['medal', 'calm', 'camel', 'came', 'meal'])).toEqual([
      'calm',
      'came',
      'meal',
      'camel',
      'medal',
    ]);
    expect(trayOrder(['asleep', 'tee', 'cent'])).toEqual(['tee', 'cent', 'asleep']);
  });

  it('measures a row of wells', () => {
    expect(wordWidth(4, 20, 8)).toBe(104);
    expect(wordWidth(1, 20, 8)).toBe(20);
    expect(wordWidth(0, 20, 8)).toBe(0);
  });

  it('packs words greedily into rows that fit', () => {
    // 3 letters = 76, 4 letters = 104 at well 20, gap 8; word gap 16.
    expect(packTray([3, 3, 4, 4, 5], 200, 20, 8, 16)).toEqual([[0, 1], [2], [3], [4]]);
    expect(packTray([3, 3, 4, 4, 5], 400, 20, 8, 16)).toEqual([
      [0, 1, 2],
      [3, 4],
    ]);
  });

  it('picks the largest well that fits the space, else the smallest', () => {
    const lengths = [3, 4, 4, 5, 6];
    const s = trayWell(lengths, 340, 160, 8, 16, 8, 44, 18);
    expect(s).toBeLessThanOrEqual(44);
    const rows = packTray(lengths, 340, s, 8, 16).length;
    expect(rows * s + (rows - 1) * 8).toBeLessThanOrEqual(160);
    // One size up would not fit.
    const up = packTray(lengths, 340, s + 1, 8, 16).length;
    expect(
      up * (s + 1) + (up - 1) * 8 > 160 || lengths.some((n) => wordWidth(n, s + 1, 8) > 340),
    ).toBe(true);
    expect(trayWell(lengths, 100, 10, 8, 16, 8, 44, 18)).toBe(18);
  });
});

describe('beadPoints', () => {
  it('puts six beads on the ring, the first at the top, clockwise', () => {
    const p = beadPoints(100, 100, 50);
    expect(p).toHaveLength(6);
    expect(p[0]!.x).toBeCloseTo(100);
    expect(p[0]!.y).toBeCloseTo(50);
    expect(p[1]!.x).toBeGreaterThan(100);
    expect(p[3]!.y).toBeCloseTo(150);
    for (const q of p) expect(Math.hypot(q.x - 100, q.y - 100)).toBeCloseTo(50);
  });
});
