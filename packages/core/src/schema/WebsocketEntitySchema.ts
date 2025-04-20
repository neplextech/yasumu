import { t, type YasumuSchemaParsableToType } from '@yasumu/schema';
import { WorkspaceModuleType } from '../modules/common/constants.js';

export const WebsocketEntitySchema = t.script({
  annotation: WorkspaceModuleType.Websocket,
  blocks: {
    Metadata: t.object({
      name: t.string(),
      id: t.string(),
      createdAt: t.number(),
      path: t.string(),
    }),
  },
});

export type WebsocketEntitySchemaType = YasumuSchemaParsableToType<
  typeof WebsocketEntitySchema
>;
