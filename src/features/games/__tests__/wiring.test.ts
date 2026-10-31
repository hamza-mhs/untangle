import { pickPauseGame } from '@/features/pause/variant';
import games from '@/i18n/en/games.json';
import { rng } from '@/lib/rng';
import { addDays } from '@/lib/time';

import { GAMES, isNewGame, isQuickGame, latestBatch, NEW_DAYS, type GameId } from '../catalog';
import { REGISTRY } from '../registry';
import { pickTraining } from '../training';

/** Batch 3.2e: the 14 daily-core games are wired into the tab, training and the pause pool. */
const DAILY_CORE: GameId[] = [
  'swapIt',
  'flashCount',
  'spotTheOddOne',
  'trackTheStars',
  'patternRecall',
  'numberSpan',
  'stopOnTheBeep',
  'oppositeDay',
  'ruleFlip',
  'sortTheStream',
  'quickMaths',
  'biggerTotal',
  'timeItRight',
  'orbitSwitch',
];
const day = '2026-10-30';

describe('3.2 wiring', () => {
  it('has a board and strings for every catalogue game', () => {
    const list = games.games.list as Record<string, { name?: string; how?: string }>;
    for (const g of GAMES) {
      expect(REGISTRY[g.id]).toBeDefined();
      expect(list[g.id]?.name).toBeTruthy();
      expect(list[g.id]?.how).toBeTruthy();
    }
  });

  it('tags exactly the latest batch New, for 14 days', () => {
    const latest = GAMES.filter((g) => g.batch === latestBatch())
      .map((g) => g.id)
      .sort();
    expect(latest.length).toBeGreaterThan(0);
    const tagged = (on: string) =>
      GAMES.filter((g) => isNewGame(g, day, on))
        .map((g) => g.id)
        .sort();
    expect(tagged(day)).toEqual(latest);
    expect(tagged(addDays(day, NEW_DAYS - 1))).toEqual(latest);
    expect(tagged(addDays(day, NEW_DAYS))).toEqual([]);
    // Earlier batches (3.2 daily core) are no longer New once a newer batch ships.
    if (latestBatch() !== '3.2') for (const id of DAILY_CORE) expect(latest).not.toContain(id);
  });

  it('compares batches as numbers', () => {
    const g = GAMES[0]!;
    expect(isNewGame({ ...g, batch: '3.10' }, day, day, '3.10')).toBe(true);
    expect(latestBatch([g, { ...g, batch: '3.10' }, { ...g, batch: '3.9' }])).toBe('3.10');
  });

  it('puts every daily-core game in the training rotation within 60 days', () => {
    const seen = new Set<GameId>();
    let yesterday: GameId[] | null = null;
    for (let i = 0; i < 60; i++) {
      const ids = pickTraining({ day: addDays(day, i), lastPlayed: {}, yesterday });
      ids.forEach((id) => seen.add(id));
      yesterday = ids;
    }
    for (const id of DAILY_CORE) expect(seen).toContain(id);
  });

  it('offers every daily-core game from the pause quick-game pool', () => {
    for (const id of DAILY_CORE) expect(isQuickGame(GAMES.find((g) => g.id === id)!)).toBe(true);
    const rand = rng(7);
    const offered = new Set<GameId>();
    for (let i = 0; i < 2000; i++)
      offered.add(pickPauseGame({ training: [], playedToday: new Set(), recentOffered: [], rand }));
    for (const id of DAILY_CORE) expect(offered).toContain(id);
  });
});
