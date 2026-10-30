CREATE TABLE `daily_summary` (
	`date` text PRIMARY KEY NOT NULL,
	`screen_time_ms` integer DEFAULT 0 NOT NULL,
	`blocked_time_ms` integer DEFAULT 0 NOT NULL,
	`pickups` integer,
	`detours` integer DEFAULT 0 NOT NULL,
	`games_played` integer DEFAULT 0 NOT NULL,
	`goal_met` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `detours` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`at` integer NOT NULL,
	`target_key` text NOT NULL,
	`choice` text NOT NULL,
	`lock_id` text
);
--> statement-breakpoint
CREATE INDEX `detours_at_idx` ON `detours` (`at`);--> statement-breakpoint
CREATE TABLE `focus_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` integer NOT NULL,
	`planned_ms` integer NOT NULL,
	`ended_at` integer,
	`ended_early` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_bests` (
	`game_id` text PRIMARY KEY NOT NULL,
	`best_score` integer NOT NULL,
	`best_stat_json` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`duration_ms` integer NOT NULL,
	`score` integer NOT NULL,
	`stars` integer NOT NULL,
	`stats_json` text DEFAULT '{}' NOT NULL,
	`source` text NOT NULL,
	`completed` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `game_results_game_idx` ON `game_results` (`game_id`,`started_at`);