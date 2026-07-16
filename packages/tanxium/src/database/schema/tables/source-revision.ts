import type { JsonValue, SourceEntityKind } from '@yasumu/common';
import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { commonColumns, json } from '../../common/index.ts';
import { workspaces } from './workspaces.ts';

export const sourceRevisions = sqliteTable(
  'source_revisions',
  {
    ...commonColumns(),
    workspaceId: text('workspaceId')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    entityKind: text('entityKind').$type<SourceEntityKind>().notNull(),
    entityId: text('entityId').notNull(),
    sourcePath: text('sourcePath').notNull(),
    sourceRevision: text('sourceRevision').notNull(),
    sourceSnapshot: json<JsonValue>('sourceSnapshot').notNull(),
    databaseSnapshot: json<JsonValue>('databaseSnapshot'),
  },
  (table) => [
    uniqueIndex('source_revisions_workspace_kind_entity_unique').on(
      table.workspaceId,
      table.entityKind,
      table.entityId,
    ),
    index('source_revisions_workspace_source_path_idx').on(table.workspaceId, table.sourcePath),
  ],
);
