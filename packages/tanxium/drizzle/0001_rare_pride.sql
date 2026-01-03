CREATE TABLE `entity_history` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`entityType` text NOT NULL,
	`workspaceId` text NOT NULL,
	`entityId` text NOT NULL,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
