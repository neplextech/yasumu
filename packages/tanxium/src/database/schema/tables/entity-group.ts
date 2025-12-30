import { AnySQLiteColumn, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { commonColumns } from '../../common/index.ts';
import { workspaces } from './workspaces.ts';

export const entityGroups = sqliteTable('entity_groups', {
  ...commonColumns(),
  name: text('name').notNull(),
  parentId: text('parentId').references(
    (): AnySQLiteColumn => entityGroups.id,
    {
      onDelete: 'cascade',
    },
  ),
  workspaceId: text('workspaceId')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  entityType: text({
    enum: ['rest', 'graphql', 'websocket', 'socketio', 'sse'] as const,
  }).notNull(),
});

export type EntityGroupEntityType =
  (typeof entityGroups.$inferSelect)['entityType'];
