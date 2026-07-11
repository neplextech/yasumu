import { t } from '@yasumu/schema';

import { EntityGroupEntityType } from '@/database/schema.ts';

import { YasumuAnnotations } from './constants.ts';

export const WorkspaceSchema = t.script({
  annotation: YasumuAnnotations.Workspace,
  blocks: {
    metadata: t.object({
      id: t.string(),
      name: t.string(),
      version: t.number(),
    }),
    snapshot: t.number(),
    groups: t.record(
      t.object({
        id: t.string(),
        name: t.string(),
        entity: t.enum('rest' as EntityGroupEntityType),
        parentId: t.nullable(t.string()),
        workspaceId: t.string(),
      }),
    ),
  },
});
