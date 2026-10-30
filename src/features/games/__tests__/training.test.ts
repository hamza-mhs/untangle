import { addDays } from '@/lib/time';

import { gameMeta, GAMES, isQuickGame } from '../catalog';
import { pickTraining, rng } from '../training';

describe('rng', () => {
  it('is deterministic', () => {
    const a = rng(42);
    const b = rng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('pickTraining', () => {
  const day = '2026-10-30';

  it('is the same for the same day', () => {
    const a = pickTraining({ day, lastPlayed: {}, yesterday: null });
    expect(pickTraining({ day, lastPlayed: {}, yesterday: null })).toEqual(a);
  });

  it('obeys the rules over 1,000 days', () => {
    let yesterday: ReturnType<typeof pickTraining> | null = null;
    for (let i = 0; i < 1000; i++) {
      const d = addDays(day, i);
      const ids = pickTraining({ day: d, lastPlayed: {}, yesterday });
      expect(ids).toHaveLength(3);
      const metas = ids.map((id) => gameMeta(id)!);
      expect(new Set(metas.map((m) => m.group)).size).toBe(3);
      expect(isQuickGame(metas[0]!)).toBe(true);
      if (yesterday) expect([...ids].sort()).not.toEqual([...yesterday].sort());
      yesterday = ids;
    }
  });

  it('prefers games not played in the last 3 days', () => {
    const lastPlayed = Object.fromEntries(
      GAMES.filter((g) => !['colourWord', 'echo', 'breathCount'].includes(g.id)).map((g) => [
        g.id,
        day,
      ]),
    );
    const ids = pickTraining({ day, lastPlayed, yesterday: null });
    expect([...ids].sort()).toEqual(['breathCount', 'colourWord', 'echo']);
  });
});
