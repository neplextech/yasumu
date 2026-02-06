import { relations } from 'drizzle-orm';
import { graphqlEntities } from '../tables/graphql-entity.ts';
import { graphqlEntityDependencies } from '../tables/graphql-entity.ts';
import { workspaces } from '../tables/workspaces.ts';
import { entityGroups } from '../tables/entity-group.ts';

export const graphqlEntitiesRelations = relations(
  graphqlEntities,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [graphqlEntities.workspaceId],
      references: [workspaces.id],
    }),
    dependencyEntries: many(graphqlEntityDependencies),
    dependentEntries: many(graphqlEntityDependencies),
    group: one(entityGroups, {
      fields: [graphqlEntities.groupId],
      references: [entityGroups.id],
    }),
  }),
);

export const graphqlEntityDependenciesRelations = relations(
  graphqlEntityDependencies,
  ({ one }) => ({
    graphqlEntity: one(graphqlEntities, {
      fields: [graphqlEntityDependencies.graphqlEntityId],
      references: [graphqlEntities.id],
      relationName: 'dependencyEntries',
    }),
    dependsOn: one(graphqlEntities, {
      fields: [graphqlEntityDependencies.dependsOnId],
      references: [graphqlEntities.id],
      relationName: 'dependentEntries',
    }),
  }),
);
