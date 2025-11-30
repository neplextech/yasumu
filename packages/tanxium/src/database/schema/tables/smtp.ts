import { sqliteTable, int, text } from 'drizzle-orm/sqlite-core';
import { commonColumns, cuid } from '../../common/index.ts';

export const smtp = sqliteTable('smtp', {
  ...commonColumns(),
  workspaceId: cuid('workspaceId').notNull(),
  port: int('port').notNull().default(50478),
});

export const emails = sqliteTable('emails', {
  ...commonColumns(),
  smtpId: cuid('smtpId').notNull(),
  from: text('from').notNull(),
  to: text('to').notNull(),
  subject: text('subject').notNull(),
  html: text('html').notNull(),
  text: text('text').notNull(),
  cc: text('cc'),
});
