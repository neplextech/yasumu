CREATE TABLE `sse_entity` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`name` text NOT NULL,
	`workspaceId` text NOT NULL,
	`method` text NOT NULL,
	`url` text,
	`requestParameters` text,
	`searchParameters` text,
	`requestHeaders` text,
	`requestBody` text,
	`eventTypes` text,
	`reconnect` text,
	`script` text,
	`testScript` text,
	`groupId` text,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`groupId`) REFERENCES `entity_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sse_entity_dependency` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`sseEntityId` text NOT NULL,
	`dependsOnId` text NOT NULL,
	FOREIGN KEY (`sseEntityId`) REFERENCES `sse_entity`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dependsOnId`) REFERENCES `sse_entity`(`id`) ON UPDATE no action ON DELETE cascade
);
