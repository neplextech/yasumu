import { relations } from 'drizzle-orm';

import { entityGroups } from '../tables/entity-group.ts';
import { sseEntities, sseEntityDependencies } from '../tables/sse-entity.ts';
import { workspaces } from '../tables/workspaces.ts';

export const sseEntitiesRelations = relations(sseEntities, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [sseEntities.workspaceId], references: [workspaces.id] }),
  dependencyEntries: many(sseEntityDependencies),
  dependentEntries: many(sseEntityDependencies),
  group: one(entityGroups, { fields: [sseEntities.groupId], references: [entityGroups.id] }),
}));

export const sseEntityDependenciesRelations = relations(sseEntityDependencies, ({ one }) => ({
  sseEntity: one(sseEntities, {
    fields: [sseEntityDependencies.sseEntityId],
    references: [sseEntities.id],
    relationName: 'dependencyEntries',
  }),
  dependsOn: one(sseEntities, {
    fields: [sseEntityDependencies.dependsOnId],
    references: [sseEntities.id],
    relationName: 'dependentEntries',
  }),
}));
