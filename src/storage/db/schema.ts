import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * SQLite history tables. Change this file, then run `npm run db:generate` to create a new
 * migration in /drizzle (committed; applied on launch by DatabaseProvider).
 */

/** One row per local calendar day the app was used. */
export const days = sqliteTable('days', {
  day: text('day').primaryKey(), // 'YYYY-MM-DD'
  drawnCards: text('drawn_cards', { mode: 'json' }).$type<string[]>(),
  challengesDone: integer('challenges_done').notNull().default(0),
  verifiedDone: integer('verified_done').notNull().default(0),
  frozen: integer('frozen', { mode: 'boolean' }).notNull().default(false),
  clarity: real('clarity'),
  focusMinutes: integer('focus_minutes').notNull().default(0),
});

export const focusSessions = sqliteTable(
  'focus_sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    startedAt: integer('started_at').notNull(),
    endsAt: integer('ends_at').notNull(),
    plannedMinutes: integer('planned_minutes').notNull(),
    lockedCount: integer('locked_count').notNull().default(0),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => [index('focus_started_idx').on(t.startedAt)],
);

/** Append-only points + earned-minutes ledger. Balances are sums over this table. */
export const ledger = sqliteTable(
  'ledger',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    at: integer('at').notNull(),
    day: text('day').notNull(),
    kind: text('kind', {
      enum: ['challenge', 'rep', 'focus', 'spend', 'bonus', 'boss', 'redeem'],
    }).notNull(),
    points: integer('points').notNull().default(0),
    minutes: integer('minutes').notNull().default(0),
    verification: text('verification', { enum: ['verified', 'timed', 'word'] }),
    ref: text('ref'),
  },
  (t) => [index('ledger_day_idx').on(t.day)],
);

export const repResults = sqliteTable(
  'rep_results',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    at: integer('at').notNull(),
    kind: text('kind', {
      enum: ['maths', 'letter-guess', 'target', 'pairs', 'span', 'read-aloud'],
    }).notNull(),
    seed: integer('seed').notNull(),
    score: integer('score').notNull(),
    durationMs: integer('duration_ms').notNull(),
  },
  (t) => [index('rep_kind_at_idx').on(t.kind, t.at)],
);

/** Logged emergency passes (Locked rules). */
export const emergencyPasses = sqliteTable('emergency_passes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  at: integer('at').notNull(),
  ruleId: text('rule_id').notNull(),
  reason: text('reason').notNull(),
});

/** The user's own rewards (FRewards vault). Costs are points. */
export const vaultItems = sqliteTable('vault_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  size: text('size', { enum: ['small', 'medium', 'big'] }).notNull(),
  cost: integer('cost').notNull(),
  createdAt: integer('created_at').notNull(),
  archivedAt: integer('archived_at'),
});

/** Redemptions (FRedeem): the points leave via a ledger row with kind = 'redeem'. */
export const redemptions = sqliteTable(
  'redemptions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    itemId: text('item_id').notNull(),
    at: integer('at').notNull(),
    cost: integer('cost').notNull(),
    verifiedPercent: integer('verified_percent'),
    /** Local file URI of the optional photo; never uploaded. */
    photoUri: text('photo_uri'),
  },
  (t) => [index('redemptions_at_idx').on(t.at)],
);
