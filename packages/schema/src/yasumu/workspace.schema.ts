import { t } from '../parsable.js';
import { YasumuAnnotations } from './annotations.js';

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
        entity: t.enum('rest', 'graphql', 'websocket', 'socketio', 'sse'),
        parentId: t.nullable(t.string()),
        workspaceId: t.string(),
        script: t.optional(t.nullable(t.code())),
      }),
    ),
    script: t.optional(t.nullable(t.code())),
  },
});
