import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { commonColumns, cuid, timestamp } from '../../common/index.ts';

export interface WorkspaceMetadata {
  /**
   * The file-system path to the workspace directory.
   */
  path: string;
}

export const workspaces = sqliteTable('workspaces', {
  ...commonColumns<WorkspaceMetadata>(),
  name: text('name').notNull(),
  version: int('version').notNull().default(0),
  path: text('path').notNull(),
  lastOpenedAt: timestamp('lastOpenedAt'),
  activeEnvironmentId: cuid('activeEnvironmentId'),
});
