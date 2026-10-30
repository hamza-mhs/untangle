import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';

import { dayKey, dayStart, addDays, type DayKey } from '@/lib/time';
import { db } from '@/storage/db/client';
import { gameBests, gameResults } from '@/storage/db/schema';

import { gameMeta, type GameId } from './catalog';
import type { RoundResult } from './engine/types';

export type GameSource = 'training' | 'browse' | 'pause';

export type { RoundResult } from './engine/types';

export type SavedResult = { isNewBest: boolean };

/** Writes one game_results row, and the best when it improves (30-phase3 §A.2.9). */
export function saveResult(args: {
  gameId: GameId;
  startedAt: number;
  durationMs: number;
  result: RoundResult | null;
  source: GameSource;
  completed: boolean;
}): SavedResult {
  const { gameId, startedAt, durationMs, result, source, completed } = args;
  db.insert(gameResults)
    .values({
      gameId,
      startedAt,
      durationMs,
      score: result?.score ?? 0,
      stars: result?.stars ?? 0,
      statsJson: JSON.stringify({
        stats: result?.stats ?? [],
        best: result?.best ?? null,
        ...(result?.items?.length ? { items: result.items } : {}),
      }),
      source,
      completed,
    })
    .run();
  const meta = gameMeta(gameId);
  if (!completed || !result?.best || !meta?.best) return { isNewBest: false };
  const prev = db.select().from(gameBests).where(eq(gameBests.gameId, gameId)).get();
  const better =
    !prev ||
    (meta.best.higher ? result.best.value > prev.bestScore : result.best.value < prev.bestScore);
  if (!better) return { isNewBest: false };
  const row = {
    gameId,
    bestScore: result.best.value,
    bestStatJson: JSON.stringify(result.best),
    updatedAt: Date.now(),
  };
  db.insert(gameBests).values(row).onConflictDoUpdate({ target: gameBests.gameId, set: row }).run();
  return { isNewBest: !!prev };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Content item ids a game served in the last `days` days (newest first), from stats_json. */
export function recentItemIds(gameId: GameId, days = 30, now = Date.now()): string[] {
  const rows = db
    .select({ statsJson: gameResults.statsJson })
    .from(gameResults)
    .where(and(eq(gameResults.gameId, gameId), gte(gameResults.startedAt, now - days * DAY_MS)))
    .orderBy(desc(gameResults.startedAt))
    .all();
  const out: string[] = [];
  for (const r of rows) {
    try {
      const items = (JSON.parse(r.statsJson) as { items?: unknown }).items;
      if (Array.isArray(items))
        out.push(...items.filter((x): x is string => typeof x === 'string'));
    } catch {
      // Old or broken row: nothing to skip.
    }
  }
  return out;
}

/** Completed games per day (for training, the streak and Progress). */
export function completedByDay(from: DayKey, to: DayKey): Record<DayKey, number> {
  const rows = db
    .select({ startedAt: gameResults.startedAt })
    .from(gameResults)
    .where(
      and(
        eq(gameResults.completed, true),
        gte(gameResults.startedAt, dayStart(from)),
        lt(gameResults.startedAt, dayStart(addDays(to, 1))),
      ),
    )
    .all();
  const out: Record<DayKey, number> = {};
  for (const r of rows) {
    const k = dayKey(r.startedAt);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/** Game ids completed today. */
export function playedToday(today: DayKey = dayKey()): Set<string> {
  const rows = db
    .select({ gameId: gameResults.gameId })
    .from(gameResults)
    .where(and(eq(gameResults.completed, true), gte(gameResults.startedAt, dayStart(today))))
    .all();
  return new Set(rows.map((r) => r.gameId));
}

/** Last day each game was completed. */
export function lastPlayedDays(): Record<string, DayKey> {
  const rows = db
    .select({ gameId: gameResults.gameId, last: sql<number>`max(${gameResults.startedAt})` })
    .from(gameResults)
    .where(eq(gameResults.completed, true))
    .groupBy(gameResults.gameId)
    .all();
  return Object.fromEntries(rows.map((r) => [r.gameId, dayKey(r.last)]));
}

export type BestRow = { gameId: string; value: number; label: string; updatedAt: number };

export function allBests(): BestRow[] {
  return db
    .select()
    .from(gameBests)
    .orderBy(desc(gameBests.updatedAt))
    .all()
    .map((r) => {
      let label = String(r.bestScore);
      try {
        label = (JSON.parse(r.bestStatJson) as { label?: string }).label ?? label;
      } catch {
        // Keep the number.
      }
      return { gameId: r.gameId, value: r.bestScore, label, updatedAt: r.updatedAt };
    });
}

/** Games played in a window, and how many different ones (Progress). */
export function gamesPlayedBetween(from: number, to: number): { total: number; distinct: number } {
  const rows = db
    .select({ gameId: gameResults.gameId })
    .from(gameResults)
    .where(
      and(
        eq(gameResults.completed, true),
        gte(gameResults.startedAt, from),
        lt(gameResults.startedAt, to),
      ),
    )
    .all();
  return { total: rows.length, distinct: new Set(rows.map((r) => r.gameId)).size };
}
