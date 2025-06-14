import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const errors = sqliteTable('errors', {
  id: integer().primaryKey(),
  message: text(),
  stack: text(),
  createdAt: integer({ mode: 'timestamp' }),
});
