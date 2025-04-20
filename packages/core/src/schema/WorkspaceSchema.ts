import { t, type YasumuSchemaParsableToType } from '@yasumu/schema';
import { WorkspaceModuleType } from '../modules/common/constants.js';
import { YASUMU_WORKSPACE_ANNOTATION } from '@/common/constants.js';

export const WorkspaceSchema = t.script({
  annotation: YASUMU_WORKSPACE_ANNOTATION,
  blocks: {
    Metadata: t.object({
      name: t.string(),
      id: t.string(),
      createdAt: t.number(),
      version: t.string(),
    }),
    Environment: t.object({
      selectedEnvironment: t.string(),
      environments: t.record(
        t.object({
          name: t.string(),
          id: t.string(),
          createdAt: t.number(),
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
              enabled: t.boolean(),
            }),
          ),
        }),
      ),
    }),
    [WorkspaceModuleType.Rest]: t.object({
      entities: t.record(
        t.object({
          name: t.string(),
          id: t.string(),
          method: t.string(),
          path: t.string(),
        }),
      ),
    }),
    [WorkspaceModuleType.GraphQL]: t.object({
      entities: t.record(
        t.object({
          name: t.string(),
          id: t.string(),
          method: t.string(),
          path: t.string(),
        }),
      ),
    }),
    [WorkspaceModuleType.SMTP]: t.object({
      entities: t.record(
        t.object({
          name: t.string(),
          id: t.string(),
          path: t.string(),
        }),
      ),
    }),
    [WorkspaceModuleType.Websocket]: t.object({
      entities: t.record(
        t.object({
          name: t.string(),
          id: t.string(),
          path: t.string(),
        }),
      ),
    }),
    [WorkspaceModuleType.SocketIO]: t.object({
      entities: t.record(
        t.object({
          name: t.string(),
          id: t.string(),
          path: t.string(),
        }),
      ),
    }),
    [WorkspaceModuleType.SSE]: t.object({
      entities: t.record(
        t.object({
          name: t.string(),
          id: t.string(),
          method: t.string(),
          path: t.string(),
        }),
      ),
    }),
  },
});

export type WorkspaceSchemaType = YasumuSchemaParsableToType<
  typeof WorkspaceSchema
>;
