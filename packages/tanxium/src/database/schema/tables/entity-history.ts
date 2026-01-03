import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { commonColumns } from "../../common/index.ts";
import { workspaces } from "./workspaces.ts";


export const entityHistory = sqliteTable('entity_history', {
  ...commonColumns(),
  entityType: text({
    enum: ['rest', 'graphql', 'websocket', 'socketio', 'sse'] as const,
  }).notNull(),
  workspaceId: text('workspaceId')
  .notNull()
  .references(() => workspaces.id, { onDelete: 'cascade' }),
  entityId: text('entityId').notNull(),
});