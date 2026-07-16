import type { YasumuEmbeddedScript } from '@yasumu/common';
import { AnySQLiteColumn, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { commonColumns, json } from '../../common/index.ts';
import { workspaces } from './workspaces.ts';

export const entityGroups = sqliteTable('entity_groups', {
  ...commonColumns(),
  name: text('name').notNull(),
  parentId: text('parentId').references((): AnySQLiteColumn => entityGroups.id, {
    onDelete: 'cascade',
  }),
  workspaceId: text('workspaceId')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  entityType: text({
    enum: ['rest', 'graphql', 'websocket', 'socketio', 'sse'] as const,
  }).notNull(),
  script: json<YasumuEmbeddedScript>('script'),
});

export type EntityGroupEntityType = (typeof entityGroups.$inferSelect)['entityType'];
