import {
  FIELD,
  trackPaths,
  trackPick,
  trackStars,
  trackTargets,
  TRACK_BEADS,
  TRACK_DRIFT_MS,
  TRACK_FPS,
  TRACK_ROUNDS,
} from '../logic';

describe('Track the stars', () => {
  it('keeps every bead in the field and mostly apart at the end, over 1,000 seeds', () => {
    let closeFinal = 0;
    let bad = 0;
    const e = 0.001;
    for (let seed = 0; seed < 1000; seed++) {
      for (let r = 0; r < TRACK_ROUNDS; r++) {
        const frames = trackPaths(seed, r);
        if (frames.length !== (TRACK_DRIFT_MS / 1000) * TRACK_FPS + 1) bad++;
        for (const f of frames) {
          if (f.length !== TRACK_BEADS) bad++;
          for (const [x, y] of f) {
            const px = x * FIELD.w;
            const py = y * FIELD.h;
            if (px < FIELD.edge - e || px > FIELD.w - FIELD.edge + e) bad++;
            if (py < FIELD.edge - e || py > FIELD.h - FIELD.edge + e) bad++;
          }
        }
        const last = frames[frames.length - 1]!;
        for (let i = 0; i < last.length; i++)
          for (let j = i + 1; j < last.length; j++) {
            const d = Math.hypot(
              (last[i]![0] - last[j]![0]) * FIELD.w,
              (last[i]![1] - last[j]![1]) * FIELD.h,
            );
            if (d < FIELD.bead * 0.8) closeFinal++;
          }
      }
    }
    expect(bad).toBe(0);
    // Where they stop, beads must be tappable one by one: overlaps are rare (< 2 % of rounds).
    expect(closeFinal).toBeLessThan(80);
  });

  it('picks 2, 3, 4, 4 distinct targets', () => {
    for (let seed = 0; seed < 1000; seed++)
      for (let r = 0; r < TRACK_ROUNDS; r++) {
        const p = trackPick(seed, r);
        expect(p).toHaveLength(trackTargets(r));
        expect(new Set(p).size).toBe(p.length);
      }
    expect([0, 1, 2, 3].map(trackTargets)).toEqual([2, 3, 4, 4]);
  });

  it('keeps the prototype top star rule', () => {
    expect(trackStars(13, 0, 13)).toBe(3);
    expect(trackStars(9, 4, 13)).toBe(2);
    expect(trackStars(3, 10, 13)).toBe(1);
  });
});
