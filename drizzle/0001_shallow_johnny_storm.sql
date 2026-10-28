CREATE TABLE `redemptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` text NOT NULL,
	`at` integer NOT NULL,
	`cost` integer NOT NULL,
	`verified_percent` integer,
	`photo_uri` text
);
--> statement-breakpoint
CREATE INDEX `redemptions_at_idx` ON `redemptions` (`at`);--> statement-breakpoint
CREATE TABLE `vault_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`size` text NOT NULL,
	`cost` integer NOT NULL,
	`created_at` integer NOT NULL,
	`archived_at` integer
);
