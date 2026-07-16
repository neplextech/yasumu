import { relations } from 'drizzle-orm';

import { executionHistory } from '../tables/execution-history.ts';
import { workspaces } from '../tables/workspaces.ts';

export const executionHistoryRelations = relations(executionHistory, ({ many, one }) => ({
  workspace: one(workspaces, {
    fields: [executionHistory.workspaceId],
    references: [workspaces.id],
  }),
  parent: one(executionHistory, {
    fields: [executionHistory.parentExecutionId],
    references: [executionHistory.executionId],
    relationName: 'executionParent',
  }),
  children: many(executionHistory, {
    relationName: 'executionParent',
  }),
  root: one(executionHistory, {
    fields: [executionHistory.rootExecutionId],
    references: [executionHistory.executionId],
    relationName: 'executionRoot',
  }),
  descendants: many(executionHistory, {
    relationName: 'executionRoot',
  }),
}));
