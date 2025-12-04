import { relations } from 'drizzle-orm';
import { entityGroups } from '../tables/entity-group.ts';

export const entityGroupRelations = relations(
  entityGroups,
  ({ many, one }) => ({
    children: many(entityGroups),
    parent: one(entityGroups, {
      fields: [entityGroups.parentId],
      references: [entityGroups.id],
    }),
  }),
);
