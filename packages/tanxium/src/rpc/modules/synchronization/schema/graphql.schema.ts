import { t } from '@yasumu/schema';
import { YasumuAnnotations } from './constants.ts';

const KeyValuePairSchema = t.object({
  key: t.string(),
  value: t.string(),
  enabled: t.boolean(),
});

export const GraphqlSchema = t.script({
  annotation: YasumuAnnotations.Graphql,
  blocks: {
    metadata: t.object({
      name: t.string(),
      id: t.string(),
      groupId: t.nullable(t.string()),
    }),
    request: t.object({
      url: t.nullable(t.string()),
      headers: t.list(KeyValuePairSchema),
      parameters: t.list(KeyValuePairSchema),
      searchParameters: t.list(KeyValuePairSchema),
      body: t.nullable(
        t.object({
          type: t.string(),
          content: t.nullable(t.string()),
        }),
      ),
    }),
    dependencies: t.list(t.string()),
    script: t.nullable(t.code()),
    test: t.nullable(t.code()),
  },
});
