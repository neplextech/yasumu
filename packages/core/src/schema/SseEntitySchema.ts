import { t, type YasumuSchemaParsableToType } from '@yasumu/schema';
import { WorkspaceModuleType } from '../modules/common/constants.js';

export const SseEntitySchema = t.script({
  annotation: WorkspaceModuleType.SSE,
  blocks: {
    Metadata: t.object({
      name: t.string(),
      id: t.string(),
      createdAt: t.number(),
      path: t.string(),
    }),
  },
});

export type SseEntitySchemaType = YasumuSchemaParsableToType<
  typeof SseEntitySchema
>;
