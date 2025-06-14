import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm/sql';

export const workspaces = sqliteTable('workspaces', {
  id: integer().primaryKey(),
  name: text(),
  createdAt: integer({ mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer({ mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
