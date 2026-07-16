import type { ScriptSource } from '@yasumu/runtime-api';

import type { GraphQLEntity, RestEntity, WorkspaceEnvironment, WorkspaceGroup, YasumuWorkspace } from '../src/index.js';

const origin = { kind: 'memory' as const };

export function script(id: string, code = id): ScriptSource {
  return { id, code, sourceUrl: `memory:///${id}.ts` };
}

export function restEntity(overrides: Partial<RestEntity> = {}): RestEntity {
  return {
    kind: 'rest',
    id: 'rest-1',
    name: 'REST entity',
    workspaceId: 'workspace-1',
    groupId: null,
    method: 'GET',
    url: 'https://example.test/api',
    headers: [],
    pathParameters: [],
    searchParameters: [],
    body: null,
    scripts: {},
    dependencies: [],
    metadata: {},
    origin,
    ...overrides,
  };
}

export function graphqlEntity(overrides: Partial<GraphQLEntity> = {}): GraphQLEntity {
  return {
    kind: 'graphql',
    id: 'graphql-1',
    name: 'GraphQL entity',
    workspaceId: 'workspace-1',
    groupId: null,
    url: 'https://example.test/graphql',
    headers: [],
    pathParameters: [],
    searchParameters: [],
    body: { query: 'query Viewer { viewer { id } }' },
    scripts: {},
    dependencies: [],
    metadata: {},
    origin,
    ...overrides,
  };
}

export function group(overrides: Partial<WorkspaceGroup> = {}): WorkspaceGroup {
  return {
    id: 'group-1',
    name: 'Group',
    workspaceId: 'workspace-1',
    parentId: null,
    entityKind: 'rest',
    origin,
    ...overrides,
  };
}

export function environment(overrides: Partial<WorkspaceEnvironment> = {}): WorkspaceEnvironment {
  return {
    id: 'environment-1',
    name: 'Development',
    workspaceId: 'workspace-1',
    variables: [],
    secrets: [],
    origin,
    ...overrides,
  };
}

export function workspace(overrides: Partial<YasumuWorkspace> = {}): YasumuWorkspace {
  return {
    id: 'workspace-1',
    name: 'Workspace',
    version: 1,
    entities: [restEntity()],
    groups: [],
    environments: [],
    metadata: {},
    origin,
    ...overrides,
  };
}
