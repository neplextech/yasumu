import { t, type YasumuSchemaParsableToType } from '@yasumu/schema';
import { WorkspaceModuleType } from '../modules/common/constants.js';

export const SocketioEntitySchema = t.script({
  annotation: WorkspaceModuleType.SocketIO,
  blocks: {
    Metadata: t.object({
      name: t.string(),
      id: t.string(),
      createdAt: t.number(),
      path: t.string(),
    }),
  },
});

export type SocketioEntitySchemaType = YasumuSchemaParsableToType<
  typeof SocketioEntitySchema
>;
