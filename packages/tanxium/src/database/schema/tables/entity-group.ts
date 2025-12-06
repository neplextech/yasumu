import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { commonColumns } from '../../common/index.ts';
import { cuid } from '../../common/index.ts';

export const entityGroups = sqliteTable('entity_groups', {
  ...commonColumns(),
  name: text('name').notNull(),
  parentId: cuid('parentId'),
  entityOwnerId: cuid('entityOwnerId').notNull(),
  entityType: text({
    enum: ['rest', 'graphql', 'websocket', 'socketio', 'sse'] as const,
  }).notNull(),
});

export type EntityGroupEntityType =
  (typeof entityGroups.$inferSelect)['entityType'];
