import { sqliteTable, int, text, integer } from 'drizzle-orm/sqlite-core';
import { commonColumns } from '../../common/index.ts';
import { workspaces } from './workspaces.ts';

export const smtp = sqliteTable('smtp', {
  ...commonColumns(),
  workspaceId: text('workspaceId')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  port: int('port').notNull().default(0),
  username: text('username'),
  password: text('password'),
});

export const emails = sqliteTable('emails', {
  ...commonColumns(),
  smtpId: text('smtpId')
    .notNull()
    .references(() => smtp.id, { onDelete: 'cascade' }),
  from: text('from').notNull(),
  to: text('to').notNull(),
  subject: text('subject').notNull(),
  html: text('html').notNull(),
  text: text('text').notNull(),
  cc: text('cc'),
  unread: integer('unread', { mode: 'boolean' }).notNull().default(false),
});
