import { relations } from 'drizzle-orm';
import { restEntities } from '../tables/rest-entity.ts';
import { rest } from '../tables/rest.ts';
import { restEntityDependencies } from '../tables/rest-entity.ts';
import { entityGroups } from '../tables/entity-group.ts';

export const restEntitiesRelations = relations(
  restEntities,
  ({ one, many }) => ({
    rest: one(rest, {
      fields: [restEntities.restId],
      references: [rest.id],
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
