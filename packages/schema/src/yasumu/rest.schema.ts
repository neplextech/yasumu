import { t } from '../parsable.js';
import { YasumuAnnotations } from './annotations.js';
import { YasumuRequestSchema } from './request.schema.js';

export const RestSchema = t.script({
  annotation: YasumuAnnotations.Rest,
  blocks: {
    metadata: t.object({
      name: t.string(),
      method: t.string(),
      id: t.string(),
      groupId: t.nullable(t.string()),
    }),
    request: YasumuRequestSchema,
    dependencies: t.list(t.string()),
    script: t.nullable(t.code()),
    test: t.nullable(t.code()),
  },
});
