import { t } from '../parsable.js';
import { YasumuAnnotations } from './annotations.js';
import { YasumuRequestSchema } from './request.schema.js';

export const SseSchema = t.script({
  annotation: YasumuAnnotations.Sse,
  blocks: {
    metadata: t.object({
      name: t.string(),
      method: t.string(),
      id: t.string(),
      groupId: t.nullable(t.string()),
    }),
    request: YasumuRequestSchema,
    events: t.list(t.string()),
    reconnect: t.object({
      enabled: t.boolean(),
      retryMs: t.number(),
    }),
    dependencies: t.list(t.string()),
    script: t.nullable(t.code()),
    test: t.nullable(t.code()),
  },
});
