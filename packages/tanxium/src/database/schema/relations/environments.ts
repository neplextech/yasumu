import { relations } from 'drizzle-orm';
import { environments } from '../tables/environments.ts';
import { workspaces } from '../tables/workspaces.ts';

export const environmentsRelations = relations(environments, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [environments.workspaceId],
    references: [workspaces.id],
  }),
}));
