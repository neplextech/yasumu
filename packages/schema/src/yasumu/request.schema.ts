import { t } from '../parsable.js';

export const YasumuKeyValuePairSchema = t.object({
  key: t.string(),
  value: t.string(),
  enabled: t.boolean(),
});

export const YasumuRequestSchema = t.object({
  url: t.nullable(t.string()),
  headers: t.list(YasumuKeyValuePairSchema),
  parameters: t.list(YasumuKeyValuePairSchema),
  searchParameters: t.list(YasumuKeyValuePairSchema),
  body: t.nullable(
    t.object({
      type: t.string(),
      content: t.nullable(t.string()),
    }),
  ),
});
