import { commonColumns } from '../../common/index.ts';
import { sqliteTable } from 'drizzle-orm/sqlite-core';
import { cuid } from '../../common/index.ts';

export const rest = sqliteTable('rest', {
  ...commonColumns(),
  workspaceId: cuid('workspaceId').notNull(),
});
