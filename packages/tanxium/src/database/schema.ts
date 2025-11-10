import { text } from 'drizzle-orm/sqlite-core';
import { createTable } from './common/index.ts';

export const workspacesTable = createTable('workspaces', {
  name: text().notNull(),
});
