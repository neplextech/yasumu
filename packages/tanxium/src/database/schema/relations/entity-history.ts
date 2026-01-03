import { relations } from "drizzle-orm/relations";
import { entityHistory } from "../tables/entity-history.ts";
import { workspaces } from "../tables/workspaces.ts";

export const entityHistoryRelations = relations(
  entityHistory,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [entityHistory.workspaceId],
      references: [workspaces.id],
    }),
  }),
);