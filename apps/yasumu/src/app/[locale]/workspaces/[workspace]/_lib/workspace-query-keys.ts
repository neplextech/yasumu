export const workspaceQueryKeys = {
  environments: (workspaceId: string) => ['environments', workspaceId] as const,
  activeEnvironment: (workspaceId: string) => ['currentEnvironment', workspaceId] as const,
  restEntity: (workspaceId: string, entityId: string | null) => ['rest-entity', workspaceId, entityId] as const,
  restTab: (workspaceId: string, entityId: string) => ['rest-tab', workspaceId, entityId] as const,
  graphqlEntity: (workspaceId: string, entityId: string | null) => ['graphql-entity', workspaceId, entityId] as const,
  graphqlTab: (workspaceId: string, entityId: string) => ['graphql-tab', workspaceId, entityId] as const,
  sseEntity: (workspaceId: string, entityId: string | null) => ['sse-entity', workspaceId, entityId] as const,
  sseTab: (workspaceId: string, entityId: string) => ['sse-tab', workspaceId, entityId] as const,
  smtpConfig: (workspaceId: string) => ['smtp-config', workspaceId] as const,
  smtpPort: (workspaceId: string) => ['smtp-port', workspaceId] as const,
};
