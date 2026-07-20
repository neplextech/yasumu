import { relations } from 'drizzle-orm';

import { entityGroups } from '../tables/entity-group.ts';
import { environments } from '../tables/environments.ts';
import { executionHistory } from '../tables/execution-history.ts';
import { graphqlEntities } from '../tables/graphql-entity.ts';
import { restEntities } from '../tables/rest-entity.ts';
import { sourceRevisions } from '../tables/source-revision.ts';
import { sseEntities } from '../tables/sse-entity.ts';
import { workspaceCookies } from '../tables/workspace-cookie.ts';
import { workspaces } from '../tables/workspaces.ts';

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  rest: many(restEntities),
  graphql: many(graphqlEntities),
  sse: many(sseEntities),
  environments: many(environments),
  entityGroups: many(entityGroups),
  sourceRevisions: many(sourceRevisions),
  executionHistory: many(executionHistory),
  cookies: many(workspaceCookies),
}));
