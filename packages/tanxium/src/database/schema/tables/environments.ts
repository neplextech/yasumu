import { commonColumns, json } from '../../common/index.ts';
import { KeyValuePair } from '@/common/types.ts';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { workspaces } from './workspaces.ts';

export const environments = sqliteTable('environments', {
  ...commonColumns(),
  workspaceId: text('workspaceId')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  variables: json<KeyValuePair[]>('variables')
    .notNull()
    .$default(() => []),
  secrets: json<KeyValuePair[]>('secrets')
    .notNull()
    .$default(() => []),
});
