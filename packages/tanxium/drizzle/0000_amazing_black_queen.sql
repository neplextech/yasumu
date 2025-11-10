CREATE TABLE `workspaces` (
	`name` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	`updatedAt` text DEFAULT (current_timestamp) NOT NULL,
	`metadata` text DEFAULT '{}'
);
