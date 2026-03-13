CREATE TABLE `graphql_entity` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`name` text NOT NULL,
	`workspaceId` text NOT NULL,
	`url` text,
	`requestParameters` text,
	`searchParameters` text,
	`requestHeaders` text,
	`requestBody` text,
	`script` text,
	`groupId` text,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`groupId`) REFERENCES `entity_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `graphql_entity_dependency` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`graphqlEntityId` text NOT NULL,
	`dependsOnId` text NOT NULL,
	FOREIGN KEY (`graphqlEntityId`) REFERENCES `graphql_entity`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dependsOnId`) REFERENCES `graphql_entity`(`id`) ON UPDATE no action ON DELETE cascade
);
