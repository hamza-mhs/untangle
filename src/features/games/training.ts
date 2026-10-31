import { rng, shuffle } from '@/lib/rng';
import { addDays, type DayKey } from '@/lib/time';

import { isQuickGame, PLAYABLE, type GameId, type GameMeta } from './catalog';

export { rng };

export const TRAINING_SIZE = 3;

/** A day key as a number seed ("2026-10-30" → 20261030). */
export function daySeed(day: DayKey): number {
  return Number(day.replaceAll('-', ''));
}

export type TrainingInput = {
  day: DayKey;
  games?: readonly GameMeta[];
  /** Game id → last day played. */
  lastPlayed: Readonly<Record<string, DayKey>>;
  /** Yesterday's three, so today's set is never the same. */
  yesterday: readonly GameId[] | null;
};

/**
 * Today's three training games (20-phase2-core-app §2): seeded by the local date; three
 * different focus groups; the first ≤ 45 s and not Calm/Active; games not played in the last
 * 3 days first; never the same three as yesterday.
 */
export function pickTraining({
  day,
  games = PLAYABLE,
  lastPlayed,
  yesterday,
}: TrainingInput): GameId[] {
  const rand = rng(daySeed(day));
  const cutoff = addDays(day, -3);
  const fresh = (g: GameMeta) => !lastPlayed[g.id] || lastPlayed[g.id]! < cutoff;
  // Fresh games first, each tier shuffled with the day's seed.
  const order = [
    ...shuffle(games.filter(fresh), rand),
    ...shuffle(
      games.filter((g) => !fresh(g)),
      rand,
    ),
  ];
  const sameAsYesterday = (ids: GameId[]) =>
    !!yesterday && yesterday.length === ids.length && ids.every((id) => yesterday.includes(id));

  for (let attempt = 0; attempt < order.length; attempt++) {
    const rotated = [...order.slice(attempt), ...order.slice(0, attempt)];
    const first = rotated.find(isQuickGame);
    if (!first) break;
    const picked: GameMeta[] = [first];
    for (const g of rotated) {
      if (picked.length >= TRAINING_SIZE) break;
      if (picked.some((p) => p.id === g.id || p.group === g.group)) continue;
      picked.push(g);
    }
    const ids = picked.map((g) => g.id);
    if (ids.length === TRAINING_SIZE && !sameAsYesterday(ids)) return ids;
  }
  // Tiny catalogues (tests): best effort.
  return order.slice(0, TRAINING_SIZE).map((g) => g.id);
}
