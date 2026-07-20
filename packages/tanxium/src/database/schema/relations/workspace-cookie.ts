import { relations } from 'drizzle-orm';

import { workspaceCookies } from '../tables/workspace-cookie.ts';
import { workspaces } from '../tables/workspaces.ts';

export const workspaceCookiesRelations = relations(workspaceCookies, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceCookies.workspaceId], references: [workspaces.id] }),
}));
