CREATE TABLE `days` (
	`day` text PRIMARY KEY NOT NULL,
	`drawn_cards` text,
	`challenges_done` integer DEFAULT 0 NOT NULL,
	`verified_done` integer DEFAULT 0 NOT NULL,
	`frozen` integer DEFAULT false NOT NULL,
	`clarity` real,
	`focus_minutes` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `emergency_passes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`at` integer NOT NULL,
	`rule_id` text NOT NULL,
	`reason` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `focus_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`planned_minutes` integer NOT NULL,
	`locked_count` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `focus_started_idx` ON `focus_sessions` (`started_at`);--> statement-breakpoint
CREATE TABLE `ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`at` integer NOT NULL,
	`day` text NOT NULL,
	`kind` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`minutes` integer DEFAULT 0 NOT NULL,
	`verification` text,
	`ref` text
);
--> statement-breakpoint
CREATE INDEX `ledger_day_idx` ON `ledger` (`day`);--> statement-breakpoint
CREATE TABLE `rep_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`at` integer NOT NULL,
	`kind` text NOT NULL,
	`seed` integer NOT NULL,
	`score` integer NOT NULL,
	`duration_ms` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rep_kind_at_idx` ON `rep_results` (`kind`,`at`);