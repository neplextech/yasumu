import { relations } from 'drizzle-orm';
import { rest } from '../tables/rest.ts';
import { workspaces } from '../tables/workspaces.ts';
import { restEntities } from '../tables/rest-entity.ts';

export const restRelations = relations(rest, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [rest.workspaceId],
    references: [workspaces.id],
  }),
  entities: many(restEntities),
}));
