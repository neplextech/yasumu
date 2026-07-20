import type { JsonValue, ScriptSource, TestResult, YasumuFileReference } from '@yasumu/runtime-api';

export interface SourceOrigin {
  kind: 'ysl' | 'sqlite' | 'memory' | 'remote';
  path?: string;
  revision?: string;
  importedRevision?: string;
}

export interface TabularValue {
  key: string;
  value: string;
  enabled: boolean;
}

export interface FormDataTextEntry {
  kind: 'text';
  key: string;
  value: string;
  enabled: boolean;
}

export interface FormDataFileEntry {
  kind: 'file';
  key: string;
  file: YasumuFileReference;
  enabled: boolean;
}

export type FormDataEntry = FormDataTextEntry | FormDataFileEntry;

export type RequestBody =
  | { type: 'json'; value: JsonValue | string; metadata?: Record<string, JsonValue> }
  | { type: 'text'; value: string; metadata?: Record<string, JsonValue> }
  | { type: 'binary'; value: YasumuFileReference | null; metadata?: Record<string, JsonValue> }
  | { type: 'form-data'; value: FormDataEntry[]; metadata?: Record<string, JsonValue> }
  | { type: 'x-www-form-urlencoded'; value: TabularValue[]; metadata?: Record<string, JsonValue> };

export interface GraphQLBody {
  query: string;
  variables?: Record<string, JsonValue> | string | null;
  operationName?: string | null;
}

export interface EntityScripts {
  lifecycle?: ScriptSource;
  test?: ScriptSource;
}

export interface EntityBase {
  id: string;
  name: string;
  workspaceId: string;
  groupId: string | null;
  scripts: EntityScripts;
  dependencies: string[];
  metadata: Record<string, JsonValue>;
  origin: SourceOrigin;
}

export interface RestEntity extends EntityBase {
  kind: 'rest';
  method: string;
  url: string | null;
  headers: TabularValue[];
  pathParameters: TabularValue[];
  searchParameters: TabularValue[];
  body: RequestBody | null;
}

export interface GraphQLEntity extends EntityBase {
  kind: 'graphql';
  url: string | null;
  headers: TabularValue[];
  pathParameters: TabularValue[];
  searchParameters: TabularValue[];
  body: GraphQLBody;
}

export interface SseEntity extends EntityBase {
  kind: 'sse';
  method: string;
  url: string | null;
  headers: TabularValue[];
  pathParameters: TabularValue[];
  searchParameters: TabularValue[];
  body: RequestBody | null;
  eventTypes: string[];
  reconnect: { enabled: boolean; retryMs: number };
}

export type ExecutableEntity = RestEntity | GraphQLEntity | SseEntity;

export interface WorkspaceGroup {
  id: string;
  name: string;
  workspaceId: string;
  parentId: string | null;
  entityKind: 'rest' | 'graphql' | 'websocket' | 'socketio' | 'sse';
  script?: ScriptSource;
  origin: SourceOrigin;
}

export interface WorkspaceEnvironmentValue {
  key: string;
  value: JsonValue;
  enabled: boolean;
}

export interface WorkspaceSecretDefinition {
  key: string;
  enabled: boolean;
  value?: string;
}

export interface WorkspaceEnvironment {
  id: string;
  workspaceId: string;
  name: string;
  variables: WorkspaceEnvironmentValue[];
  secrets: WorkspaceSecretDefinition[];
  origin: SourceOrigin;
}

export interface WorkspaceSmtpConfiguration {
  id: string;
  port: number;
  username?: string | null;
  password?: string | null;
  script?: ScriptSource;
  origin: SourceOrigin;
}

export interface YasumuWorkspace {
  id: string;
  name: string;
  version: number;
  root?: string;
  activeEnvironmentId?: string | null;
  script?: ScriptSource;
  entities: ExecutableEntity[];
  groups: WorkspaceGroup[];
  environments: WorkspaceEnvironment[];
  smtp?: WorkspaceSmtpConfiguration;
  metadata: Record<string, JsonValue>;
  origin: SourceOrigin;
}

export interface ExecutionRecord {
  id: string;
  rootId: string;
  parentId?: string;
  workspaceId: string;
  entityId: string;
  entityKind: ExecutableEntity['kind'];
  status: 'completed' | 'cancelled' | 'failed';
  startedAt: number;
  completedAt: number;
  durationMs: number;
  tests: TestResult[];
  result: JsonValue;
}
