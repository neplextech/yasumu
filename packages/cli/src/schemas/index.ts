import { t } from '@yasumu/schema';

export const YasumuAnnotations = {
  Workspace: 'workspace',
  Rest: 'rest',
  Smtp: 'smtp',
  Environment: 'environment',
} as const;

const KeyValuePairSchema = t.object({
  key: t.string(),
  value: t.string(),
  enabled: t.boolean(),
});

export const WorkspaceSchema = t.script({
  annotation: YasumuAnnotations.Workspace,
  blocks: {
    metadata: t.object({
      id: t.string(),
      name: t.string(),
      version: t.number(),
    }),
    snapshot: t.number(),
    groups: t.record(
      t.object({
        id: t.string(),
        name: t.string(),
        entity: t.enum('rest' as 'rest' | 'graphql' | 'sse' | 'websocket'),
        parentId: t.nullable(t.string()),
        workspaceId: t.string(),
      }),
    ),
  },
});

export const RestSchema = t.script({
  annotation: YasumuAnnotations.Rest,
  blocks: {
    metadata: t.object({
      name: t.string(),
      method: t.string(),
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
