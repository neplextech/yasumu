import type { EntityType } from '@yasumu/common';
import { t } from '@yasumu/schema';

import { YasumuAnnotations } from './constants.js';

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
        entity: t.enum('rest' as EntityType),
        parentId: t.nullable(t.string()),
        workspaceId: t.string(),
      }),
    ),
  },
});
