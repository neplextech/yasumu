import { t } from '../parsable.js';
import { YasumuAnnotations } from './annotations.js';
import { YasumuKeyValuePairSchema } from './request.schema.js';

export const EnvironmentSchema = t.script({
  annotation: YasumuAnnotations.Environment,
  blocks: {
    metadata: t.object({
      id: t.string(),
      name: t.string(),
    }),
    variables: t.list(YasumuKeyValuePairSchema),
    secrets: t.list(YasumuKeyValuePairSchema),
  },
});
