import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { commonColumns } from '../../common/index.ts';

// @ts-ignore we are referencing the table itself
export const entityGroups = sqliteTable('entity_groups', {
  ...commonColumns(),
  name: text('name').notNull(),
  // @ts-ignore we are referencing the table itself
  parentId: text('parentId').references(() => entityGroups.id, { onDelete: 'cascade' }),
  workspaceId: text('workspaceId').notNull(),
  entityType: text({
    enum: ['rest', 'graphql', 'websocket', 'socketio', 'sse'] as const,
  }).notNull(),
});

export type EntityGroupEntityType =
  (typeof entityGroups.$inferSelect)['entityType'];
