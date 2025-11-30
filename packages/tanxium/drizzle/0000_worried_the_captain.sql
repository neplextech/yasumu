CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	`updatedAt` text DEFAULT (current_timestamp) NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`name` text NOT NULL,
	`variables` text,
	`path` text NOT NULL,
	`lastOpenedAt` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	`updatedAt` text DEFAULT (current_timestamp) NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`smtpId` text NOT NULL,
	`from` text NOT NULL,
	`to` text NOT NULL,
	`subject` text NOT NULL,
	`html` text NOT NULL,
	`text` text NOT NULL,
	`cc` text
);
--> statement-breakpoint
CREATE TABLE `smtp` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	`updatedAt` text DEFAULT (current_timestamp) NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`workspaceId` text NOT NULL,
	`port` integer DEFAULT 50478 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `environments` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	`updatedAt` text DEFAULT (current_timestamp) NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
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
	`metadata` text DEFAULT '{}' NOT NULL,
	`workspaceId` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rest_entity` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	`updatedAt` text DEFAULT (current_timestamp) NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`name` text NOT NULL,
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
	`metadata` text DEFAULT '{}' NOT NULL,
	`restEntityId` text NOT NULL,
	`dependsOnId` text NOT NULL
);
