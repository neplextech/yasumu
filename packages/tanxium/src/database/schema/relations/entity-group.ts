import { relations } from 'drizzle-orm';
import { entityGroups } from '../tables/entity-group.ts';
import { workspaces } from '../tables/workspaces.ts';

export const entityGroupRelations = relations(
  entityGroups,
  ({ many, one }) => ({
    children: many(entityGroups),
    parent: one(entityGroups, {
      fields: [entityGroups.parentId],
      references: [entityGroups.id],
    }),
    workspace: one(workspaces, {
      fields: [entityGroups.workspaceId],
      references: [workspaces.id],
    }),
  }),
);
