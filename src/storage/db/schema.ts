import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * SQLite history (00-foundations §6). Change this file, then run `npm run db:generate` to add a
 * migration in /drizzle (applied on launch by DatabaseProvider). Table names: snake_case plural.
 */

/** One row per finished or quit game round. */
export const gameResults = sqliteTable(
  'game_results',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    gameId: text('game_id').notNull(),
    startedAt: integer('started_at').notNull(),
    durationMs: integer('duration_ms').notNull(),
    score: integer('score').notNull(),
    stars: integer('stars').notNull(),
    statsJson: text('stats_json').notNull().default('{}'),
    source: text('source', { enum: ['training', 'browse', 'pause'] }).notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull(),
  },
  (t) => [index('game_results_game_idx').on(t.gameId, t.startedAt)],
);

/** Best result per game. */
export const gameBests = sqliteTable('game_bests', {
  gameId: text('game_id').primaryKey(),
  bestScore: integer('best_score').notNull(),
  bestStatJson: text('best_stat_json').notNull().default('{}'),
  updatedAt: integer('updated_at').notNull(),
});

/** One row per local calendar day (YYYY-MM-DD), written by the usage sync. */
export const dailySummary = sqliteTable('daily_summary', {
  date: text('date').primaryKey(),
  screenTimeMs: integer('screen_time_ms').notNull().default(0),
  blockedTimeMs: integer('blocked_time_ms').notNull().default(0),
  pickups: integer('pickups'),
  detours: integer('detours').notNull().default(0),
  gamesPlayed: integer('games_played').notNull().default(0),
  goalMet: integer('goal_met', { mode: 'boolean' }).notNull().default(false),
});

/** Every pause-screen choice. */
export const detours = sqliteTable(
  'detours',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    at: integer('at').notNull(),
    targetKey: text('target_key').notNull(),
    choice: text('choice', { enum: ['game', 'breath', 'back'] }).notNull(),
    lockId: text('lock_id'),
  },
  (t) => [index('detours_at_idx').on(t.at)],
);

/** Focus now sessions. */
export const focusSessions = sqliteTable('focus_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: integer('started_at').notNull(),
  plannedMs: integer('planned_ms').notNull(),
  endedAt: integer('ended_at'),
  endedEarly: integer('ended_early', { mode: 'boolean' }).notNull().default(false),
});
