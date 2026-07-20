CREATE TABLE `workspace_cookie` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`workspaceId` text NOT NULL,
	`name` text NOT NULL,
	`value` text NOT NULL,
	`domain` text NOT NULL,
	`path` text DEFAULT '/' NOT NULL,
	`expiresAt` integer,
	`secure` integer DEFAULT false NOT NULL,
	`httpOnly` integer DEFAULT false NOT NULL,
	`sameSite` text,
	`hostOnly` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_cookie_identity_unique` ON `workspace_cookie` (`workspaceId`,`name`,`domain`,`path`);--> statement-breakpoint
CREATE INDEX `workspace_cookie_workspace_idx` ON `workspace_cookie` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `workspace_cookie_expiry_idx` ON `workspace_cookie` (`workspaceId`,`expiresAt`);