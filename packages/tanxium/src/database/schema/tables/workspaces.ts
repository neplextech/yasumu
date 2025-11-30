import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { commonColumns, json } from '../../common/index.ts';
import { KeyValuePair } from '@/common/types.ts';
import { sql } from 'drizzle-orm';

export interface WorkspaceMetadata {
  /**
   * The file-system path to the workspace directory.
   */
  path: string;
}

export const workspaces = sqliteTable('workspaces', {
  ...commonColumns<WorkspaceMetadata>(),
  name: text('name').notNull(),
  variables: json<Omit<KeyValuePair, 'enabled'>[]>('variables'),
  path: text('path').notNull(),
  lastOpenedAt: text('lastOpenedAt')
    .notNull()
    .default(sql`(current_timestamp)`),
});
