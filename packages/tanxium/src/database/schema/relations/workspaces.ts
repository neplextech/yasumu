import { relations } from 'drizzle-orm';
import { workspaces } from '../tables/workspaces.ts';
import { restEntities } from '../tables/rest-entity.ts';
import { environments } from '../tables/environments.ts';
import { entityGroups } from '../tables/entity-group.ts';

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  rest: many(restEntities),
  environments: many(environments),
  entityGroups: many(entityGroups),
}));
