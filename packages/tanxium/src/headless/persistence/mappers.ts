import type { YasumuEmbeddedScript } from '@yasumu/common';
import { YasumuScriptingLanguage } from '@yasumu/common';
import type {
  ExecutableEntity,
  FormDataEntry,
  GraphQLEntity,
  RequestBody,
  RestEntity,
  SseEntity,
  SourceOrigin,
  TabularValue,
  WorkspaceEnvironment,
  WorkspaceGroup,
  WorkspaceSmtpConfiguration,
} from '@yasumu/headless';
import type { JsonValue, ScriptSource, WorkspaceEmail, YasumuFileReference } from '@yasumu/runtime-api';

import type { entityGroups } from '../../database/schema/tables/entity-group.ts';
import type { environments } from '../../database/schema/tables/environments.ts';
import type { graphqlEntities } from '../../database/schema/tables/graphql-entity.ts';
import type { restEntities } from '../../database/schema/tables/rest-entity.ts';
import type { emails, smtp } from '../../database/schema/tables/smtp.ts';
import type { sourceRevisions } from '../../database/schema/tables/source-revision.ts';
import type { sseEntities } from '../../database/schema/tables/sse-entity.ts';

export type RestRow = typeof restEntities.$inferSelect;
export type GraphqlRow = typeof graphqlEntities.$inferSelect;
export type SseRow = typeof sseEntities.$inferSelect;
export type SourceRevisionRow = typeof sourceRevisions.$inferSelect;
export type EnvironmentRow = typeof environments.$inferSelect;
export type GroupRow = typeof entityGroups.$inferSelect;
export type SmtpRow = typeof smtp.$inferSelect;
export type EmailRow = typeof emails.$inferSelect;

export function sourceKey(kind: string, entityId: string): string {
  return `${kind}:${entityId}`;
}

export function sourceMap(rows: SourceRevisionRow[]): Map<string, SourceRevisionRow> {
  return new Map(rows.map((row) => [sourceKey(row.entityKind, row.entityId), row]));
}

export function mapOrigin(revision?: SourceRevisionRow): SourceOrigin {
  if (!revision) return { kind: 'sqlite' };
  return {
    kind: 'ysl',
    path: revision.sourcePath,
    revision: revision.sourceRevision,
    importedRevision: revision.sourceRevision,
  };
}

export function mapScript(
  script: YasumuEmbeddedScript | null,
  id: string,
  origin: SourceOrigin,
): ScriptSource | undefined {
  if (!script) return undefined;
  return {
    id,
    code: script.code,
    sourceUrl: origin.path,
  };
}

export function storeScript(script?: ScriptSource): YasumuEmbeddedScript | null {
  if (!script) return null;
  return {
    language: YasumuScriptingLanguage.JavaScript,
    code: script.code,
  };
}

export function mapRestEntity(row: RestRow, dependencies: string[], revision?: SourceRevisionRow): RestEntity {
  const origin = mapOrigin(revision);
  return {
    kind: 'rest',
    id: row.id,
    name: row.name,
    workspaceId: row.workspaceId,
    groupId: row.groupId,
    method: row.method,
    url: row.url,
    headers: mapTabularValues(row.requestHeaders),
    pathParameters: mapTabularValues(row.requestParameters),
    searchParameters: mapTabularValues(row.searchParameters),
    body: mapRestBody(row.requestBody),
    scripts: {
      lifecycle: mapScript(row.script, `rest:${row.id}:lifecycle`, origin),
      test: mapScript(row.testScript, `rest:${row.id}:test`, origin),
    },
    dependencies: [...dependencies].sort(),
    metadata: jsonRecord(row.metadata),
    origin,
  };
}

export function mapGraphqlEntity(row: GraphqlRow, dependencies: string[], revision?: SourceRevisionRow): GraphQLEntity {
  const origin = mapOrigin(revision);
  return {
    kind: 'graphql',
    id: row.id,
    name: row.name,
    workspaceId: row.workspaceId,
    groupId: row.groupId,
    url: row.url,
    headers: mapTabularValues(row.requestHeaders),
    pathParameters: mapTabularValues(row.requestParameters),
    searchParameters: mapTabularValues(row.searchParameters),
    body: mapGraphqlBody(row.requestBody),
    scripts: {
      lifecycle: mapScript(row.script, `graphql:${row.id}:lifecycle`, origin),
      test: mapScript(row.testScript, `graphql:${row.id}:test`, origin),
    },
    dependencies: [...dependencies].sort(),
    metadata: jsonRecord(row.metadata),
    origin,
  };
}

export function mapSseEntity(row: SseRow, dependencies: string[], revision?: SourceRevisionRow): SseEntity {
  const origin = mapOrigin(revision);
  return {
    kind: 'sse',
    id: row.id,
    name: row.name,
    workspaceId: row.workspaceId,
    groupId: row.groupId,
    method: row.method,
    url: row.url,
    headers: mapTabularValues(row.requestHeaders),
    pathParameters: mapTabularValues(row.requestParameters),
    searchParameters: mapTabularValues(row.searchParameters),
    body: mapRestBody(row.requestBody),
    eventTypes: row.eventTypes ?? [],
    reconnect: row.reconnect ?? { enabled: true, retryMs: 3000 },
    scripts: {
      lifecycle: mapScript(row.script, `sse:${row.id}:lifecycle`, origin),
      test: mapScript(row.testScript, `sse:${row.id}:test`, origin),
    },
    dependencies: [...dependencies].sort(),
    metadata: jsonRecord(row.metadata),
    origin,
  };
}

export function mapGroup(row: GroupRow, revision?: SourceRevisionRow): WorkspaceGroup {
  const origin = mapOrigin(revision);
  return {
    id: row.id,
    name: row.name,
    workspaceId: row.workspaceId,
    parentId: row.parentId,
    entityKind: row.entityType,
    script: mapScript(row.script, `group:${row.id}`, origin),
    origin,
  };
}

export function mapEnvironment(row: EnvironmentRow, revision?: SourceRevisionRow): WorkspaceEnvironment {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    variables: row.variables.map((value) => ({ ...value })),
    secrets: row.secrets.map((secret) => ({
      key: secret.key,
      enabled: secret.enabled,
      value: secret.value || undefined,
    })),
    origin: mapOrigin(revision),
  };
}

export function mapSmtp(row: SmtpRow, revision?: SourceRevisionRow): WorkspaceSmtpConfiguration {
  const origin = mapOrigin(revision);
  return {
    id: row.id,
    port: row.port,
    username: row.username,
    password: row.password,
    script: mapScript(row.script, `smtp:${row.id}`, origin),
    origin,
  };
}

export function mapEmail(row: EmailRow): WorkspaceEmail {
  return {
    id: row.id,
    from: row.from,
    to: splitAddresses(row.to),
    cc: splitAddresses(row.cc),
    subject: row.subject,
    html: row.html,
    text: row.text,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    unread: row.unread,
    metadata: jsonRecord(row.metadata),
  };
}

export function storedEntity(entity: ExecutableEntity) {
  return {
    id: entity.id,
    workspaceId: entity.workspaceId,
    name: entity.name,
    groupId: entity.groupId,
    url: entity.url,
    requestParameters: entity.pathParameters,
    searchParameters: entity.searchParameters,
    requestHeaders: entity.headers,
    script: storeScript(entity.scripts.lifecycle),
    testScript: storeScript(entity.scripts.test),
    metadata: entity.metadata,
  };
}

export function storedRestBody(body: RequestBody | null): RestRow['requestBody'] {
  if (!body) return null;
  return {
    type: body.type,
    value: body.value,
    metadata: body.metadata ?? {},
  };
}

export function storedEnvironmentValues(environment: WorkspaceEnvironment) {
  return {
    variables: environment.variables.map((value) => ({
      key: value.key,
      value: typeof value.value === 'string' ? value.value : JSON.stringify(value.value),
      enabled: value.enabled,
    })),
    secrets: environment.secrets.map((secret) => ({
      key: secret.key,
      value: secret.value ?? '',
      enabled: secret.enabled,
    })),
  };
}

export function storedGraphqlBody(entity: GraphQLEntity): GraphqlRow['requestBody'] {
  return {
    type: 'json',
    value: {
      query: entity.body.query,
      variables: entity.body.variables ?? null,
      operationName: entity.body.operationName ?? null,
    },
    metadata: {},
  };
}

export function serializableSnapshot(value: unknown): JsonValue {
  const serialized = JSON.stringify(value, (_key, candidate) => (candidate === undefined ? null : candidate));
  return JSON.parse(serialized) as JsonValue;
}

export function safeEnvironmentSnapshot(environment: WorkspaceEnvironment): JsonValue {
  return serializableSnapshot({
    ...environment,
    secrets: environment.secrets.map(({ key, enabled }) => ({ key, enabled })),
  });
}

export function safeSmtpSnapshot(configuration: WorkspaceSmtpConfiguration): JsonValue {
  const { password: _password, ...safe } = configuration;
  return serializableSnapshot(safe);
}

function mapTabularValues(values: Array<{ key: string; value: string; enabled: boolean }> | null): TabularValue[] {
  return (values ?? []).map((value) => ({ ...value }));
}

export function mapRestBody(body: RestRow['requestBody']): RequestBody | null {
  if (!body) return null;
  const metadata = jsonRecord(body.metadata);
  switch (body.type) {
    case 'json':
      return { type: 'json', value: jsonValue(body.value), metadata };
    case 'text':
      return { type: 'text', value: typeof body.value === 'string' ? body.value : String(body.value ?? ''), metadata };
    case 'binary':
      return { type: 'binary', value: isFileReference(body.value) ? body.value : null, metadata };
    case 'form-data':
      return { type: 'form-data', value: mapFormData(body.value), metadata };
    case 'x-www-form-urlencoded':
      return {
        type: 'x-www-form-urlencoded',
        value: mapTabularValues(Array.isArray(body.value) ? (body.value as TabularValue[]) : []),
        metadata,
      };
  }
}

export function mapGraphqlBody(body: GraphqlRow['requestBody']): GraphQLEntity['body'] {
  const value = record(body?.value);
  const variables = value?.variables;
  return {
    query: typeof value?.query === 'string' ? value.query : '',
    variables: typeof variables === 'string' || variables === null || isJsonRecord(variables) ? variables : null,
    operationName:
      typeof value?.operationName === 'string' || value?.operationName === null ? value.operationName : null,
  };
}

function mapFormData(value: unknown): FormDataEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: FormDataEntry[] = [];
  for (const entry of value) {
    const item = record(entry);
    if (!item || typeof item.key !== 'string') continue;
    const enabled = typeof item.enabled === 'boolean' ? item.enabled : true;
    if (item.kind === 'file' && isFileReference(item.file)) {
      entries.push({ kind: 'file', key: item.key, file: item.file, enabled });
      continue;
    }
    if (item.kind === 'text' && typeof item.value === 'string') {
      entries.push({ kind: 'text', key: item.key, value: item.value, enabled });
      continue;
    }
    if (typeof item.value === 'string') {
      entries.push({ kind: 'text', key: item.key, value: item.value, enabled });
    }
  }
  return entries;
}

function isFileReference(value: unknown): value is YasumuFileReference {
  const candidate = record(value);
  const source = record(candidate?.source);
  return typeof candidate?.id === 'string' && typeof candidate.name === 'string' && typeof source?.type === 'string';
}

function splitAddresses(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);
}

function jsonValue(value: unknown): JsonValue | string {
  if (isJsonValue(value)) return value;
  return String(value ?? '');
}

export function jsonRecord(value: unknown): Record<string, JsonValue> {
  return isJsonRecord(value) ? value : {};
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isJsonRecord(value: unknown): value is Record<string, JsonValue> {
  return isJsonValue(value) && typeof value === 'object' && !Array.isArray(value);
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return true;
  if (Array.isArray(value)) return value.every(isJsonValue);
  const candidate = record(value);
  return !!candidate && Object.values(candidate).every(isJsonValue);
}
