import { relations } from 'drizzle-orm';
import { workspaces } from '../tables/workspaces.ts';
import { rest } from '../tables/rest.ts';
import { environments } from '../tables/environments.ts';

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  rest: many(rest),
  environments: many(environments),
}));
