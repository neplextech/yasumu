import { t } from '@yasumu/schema';
import { YasumuAnnotations } from './constants.ts';

export const EnvironmentSchema = t.script({
  annotation: YasumuAnnotations.Environment,
  blocks: {
    metadata: t.object({
      id: t.string(),
      name: t.string(),
    }),
    variables: t.list(
      t.object({
        key: t.string(),
        value: t.string(),
        enabled: t.boolean(),
      }),
    ),
    secrets: t.list(
      t.object({
        key: t.string(),
        value: t.string(),
        enabled: t.boolean(),
      }),
    ),
  },
});
