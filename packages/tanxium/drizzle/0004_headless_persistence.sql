CREATE TABLE `execution_history` (
	`executionId` text PRIMARY KEY NOT NULL,
	`parentExecutionId` text,
	`rootExecutionId` text NOT NULL,
	`workspaceId` text NOT NULL,
	`entityId` text,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`startedAt` integer NOT NULL,
	`completedAt` integer,
	`durationMs` integer,
	`result` text,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `execution_history_workspace_started_at_idx` ON `execution_history` (`workspaceId`,`startedAt`);--> statement-breakpoint
CREATE INDEX `execution_history_root_execution_id_idx` ON `execution_history` (`rootExecutionId`);--> statement-breakpoint
CREATE INDEX `execution_history_parent_execution_id_idx` ON `execution_history` (`parentExecutionId`);--> statement-breakpoint
CREATE TABLE `source_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`workspaceId` text NOT NULL,
	`entityKind` text NOT NULL,
	`entityId` text NOT NULL,
	`sourcePath` text NOT NULL,
	`sourceRevision` text NOT NULL,
	`sourceSnapshot` text NOT NULL,
	`databaseSnapshot` text,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_revisions_workspace_kind_entity_unique` ON `source_revisions` (`workspaceId`,`entityKind`,`entityId`);--> statement-breakpoint
CREATE INDEX `source_revisions_workspace_source_path_idx` ON `source_revisions` (`workspaceId`,`sourcePath`);--> statement-breakpoint
ALTER TABLE `entity_groups` ADD `script` text;--> statement-breakpoint
ALTER TABLE `graphql_entity` ADD `testScript` text;--> statement-breakpoint
ALTER TABLE `rest_entity` ADD `testScript` text;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `script` text;