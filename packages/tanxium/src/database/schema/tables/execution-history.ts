import type { ExecutionKind, ExecutionStatus, JsonValue } from '@yasumu/common';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { json } from '../../common/index.ts';
import { workspaces } from './workspaces.ts';

export const executionHistory = sqliteTable(
  'execution_history',
  {
    executionId: text('executionId').primaryKey(),
    parentExecutionId: text('parentExecutionId'),
    rootExecutionId: text('rootExecutionId').notNull(),
    workspaceId: text('workspaceId')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    entityId: text('entityId'),
    kind: text('kind').$type<ExecutionKind>().notNull(),
    status: text('status').$type<ExecutionStatus>().notNull(),
    startedAt: integer('startedAt').notNull(),
    completedAt: integer('completedAt'),
    durationMs: integer('durationMs'),
    result: json<JsonValue>('result'),
  },
  (table) => [
    index('execution_history_workspace_started_at_idx').on(table.workspaceId, table.startedAt),
    index('execution_history_root_execution_id_idx').on(table.rootExecutionId),
    index('execution_history_parent_execution_id_idx').on(table.parentExecutionId),
  ],
);
