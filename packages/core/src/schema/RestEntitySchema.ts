import { t, type YasumuSchemaParsableToType } from '@yasumu/schema';
import { WorkspaceModuleType } from '../modules/common/constants.js';

export const RestEntitySchema = t.script({
  annotation: WorkspaceModuleType.Rest,
  blocks: {
    Metadata: t.object({
      name: t.string(),
      id: t.string(),
      createdAt: t.number(),
      path: t.string(),
      method: t.string(),
    }),
    Request: t.object({
      url: t.string(),
      headers: t.list(
        t.object({
          key: t.string(),
          value: t.string(),
        }),
      ),
      body: t.nullable(t.string()),
    }),
    Response: t.object({
      status: t.nullable(t.number()),
      time: t.nullable(t.number()),
      size: t.nullable(t.number()),
      headers: t.nullable(
        t.list(
          t.object({
            key: t.string(),
            value: t.string(),
          }),
        ),
      ),
      body: t.nullable(t.string()),
    }),
    BeforeRequest: t.nullable(t.code()),
    AfterResponse: t.nullable(t.code()),
    Test: t.nullable(t.code()),
  },
});

export type RestEntitySchemaType = YasumuSchemaParsableToType<
  typeof RestEntitySchema
>;
