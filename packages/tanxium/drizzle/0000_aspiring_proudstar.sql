CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	`updatedAt` text DEFAULT (current_timestamp) NOT NULL,
	`metadata` text DEFAULT '{}',
	`name` text NOT NULL,
	`variables` text
);
--> statement-breakpoint
CREATE TABLE `environments` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	`updatedAt` text DEFAULT (current_timestamp) NOT NULL,
	`metadata` text DEFAULT '{}',
	`workspaceId` text NOT NULL,
	`name` text NOT NULL,
	`variables` text,
	`secrets` text
);
--> statement-breakpoint
CREATE TABLE `rest` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	`updatedAt` text DEFAULT (current_timestamp) NOT NULL,
	`metadata` text DEFAULT '{}',
	`workspaceId` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rest_entity` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	`updatedAt` text DEFAULT (current_timestamp) NOT NULL,
	`metadata` text DEFAULT '{}',
	`restId` text NOT NULL,
	`method` text NOT NULL,
	`url` text,
	`requestParameters` text,
	`requestHeaders` text,
	`requestBody` text,
	`script` text,
	`testScript` text
);
--> statement-breakpoint
CREATE TABLE `rest_entity_dependency` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	`updatedAt` text DEFAULT (current_timestamp) NOT NULL,
	`metadata` text DEFAULT '{}',
	`restEntityId` text NOT NULL,
	`dependsOnId` text NOT NULL
);
