PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_rest_entity` (
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
	`script` text,
	`testScript` text,
	`groupId` text,
	FOREIGN KEY (`groupId`) REFERENCES `entity_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_rest_entity`("id", "createdAt", "updatedAt", "metadata", "name", "workspaceId", "method", "url", "requestParameters", "searchParameters", "requestHeaders", "requestBody", "script", "testScript", "groupId") SELECT "id", "createdAt", "updatedAt", "metadata", "name", "workspaceId", "method", "url", "requestParameters", "searchParameters", "requestHeaders", "requestBody", "script", "testScript", "groupId" FROM `rest_entity`;--> statement-breakpoint
DROP TABLE `rest_entity`;--> statement-breakpoint
ALTER TABLE `__new_rest_entity` RENAME TO `rest_entity`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_entity_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`name` text NOT NULL,
	`parentId` text,
	`workspaceId` text NOT NULL,
	`entityType` text NOT NULL,
	FOREIGN KEY (`parentId`) REFERENCES `entity_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_entity_groups`("id", "createdAt", "updatedAt", "metadata", "name", "parentId", "workspaceId", "entityType") SELECT "id", "createdAt", "updatedAt", "metadata", "name", "parentId", "workspaceId", "entityType" FROM `entity_groups`;--> statement-breakpoint
DROP TABLE `entity_groups`;--> statement-breakpoint
ALTER TABLE `__new_entity_groups` RENAME TO `entity_groups`;