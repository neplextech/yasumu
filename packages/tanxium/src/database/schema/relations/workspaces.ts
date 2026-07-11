import { relations } from 'drizzle-orm';

import { entityGroups } from '../tables/entity-group.ts';
import { environments } from '../tables/environments.ts';
import { restEntities } from '../tables/rest-entity.ts';
import { workspaces } from '../tables/workspaces.ts';

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  rest: many(restEntities),
  environments: many(environments),
  entityGroups: many(entityGroups),
}));
