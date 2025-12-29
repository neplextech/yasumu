CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`name` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`path` text NOT NULL,
	`lastOpenedAt` integer,
	`activeEnvironmentId` text
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`smtpId` text NOT NULL,
	`from` text NOT NULL,
	`to` text NOT NULL,
	`subject` text NOT NULL,
	`html` text NOT NULL,
	`text` text NOT NULL,
	`cc` text,
	`unread` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `smtp` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`workspaceId` text NOT NULL,
	`port` integer DEFAULT 0 NOT NULL,
	`username` text,
	`password` text
);
--> statement-breakpoint
CREATE TABLE `environments` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`workspaceId` text NOT NULL,
	`name` text NOT NULL,
	`variables` text NOT NULL,
	`secrets` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rest_entity` (
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
	`groupId` text
);
--> statement-breakpoint
CREATE TABLE `rest_entity_dependency` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`restEntityId` text NOT NULL,
	`dependsOnId` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entity_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`name` text NOT NULL,
	`parentId` text,
	`workspaceId` text NOT NULL,
	`entityType` text NOT NULL
);
