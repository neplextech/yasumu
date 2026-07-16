import { relations } from 'drizzle-orm';

import { sourceRevisions } from '../tables/source-revision.ts';
import { workspaces } from '../tables/workspaces.ts';

export const sourceRevisionsRelations = relations(sourceRevisions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [sourceRevisions.workspaceId],
    references: [workspaces.id],
  }),
}));
