import { relations } from 'drizzle-orm';
import { restEntities } from '../tables/rest-entity.ts';
import { restEntityDependencies } from '../tables/rest-entity.ts';
import { workspaces } from '../tables/workspaces.ts';
import { entityGroups } from '../tables/entity-group.ts';

export const restEntitiesRelations = relations(
  restEntities,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [restEntities.workspaceId],
      references: [workspaces.id],
    }),
    dependencyEntries: many(restEntityDependencies),
    dependentEntries: many(restEntityDependencies),
    group: one(entityGroups, {
      fields: [restEntities.groupId],
      references: [entityGroups.id],
    }),
  }),
);

export const restEntityDependenciesRelations = relations(
  restEntityDependencies,
  ({ one }) => ({
    restEntity: one(restEntities, {
      fields: [restEntityDependencies.restEntityId],
      references: [restEntities.id],
      relationName: 'dependencyEntries',
    }),
    dependsOn: one(restEntities, {
      fields: [restEntityDependencies.dependsOnId],
      references: [restEntities.id],
      relationName: 'dependentEntries',
    }),
  }),
);
