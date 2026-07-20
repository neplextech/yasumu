import type { Diagnostic, JsonValue, ScriptSource, SourceRange, YasumuFileReference } from '@yasumu/runtime-api';
import {
  deserialize,
  EnvironmentSchema,
  GraphqlSchema,
  RestSchema,
  SmtpSchema,
  SseSchema,
  WorkspaceSchema,
} from '@yasumu/schema';

import { WorkspaceValidationError, YasumuErrorCodes } from './errors.js';
import type {
  ExecutableEntity,
  FormDataEntry,
  GraphQLBody,
  GraphQLEntity,
  RequestBody,
  RestEntity,
  SseEntity,
  SourceOrigin,
  TabularValue,
  WorkspaceEnvironment,
  WorkspaceGroup,
  WorkspaceSmtpConfiguration,
  YasumuWorkspace,
} from './model.js';
import type { WorkspaceSource, WorkspaceSourceFile } from './ports.js';
import { stableHash } from './reconciliation.js';

type ParsedFile =
  | { kind: 'workspace'; path: string; revision: string; value: ParsedWorkspace }
  | { kind: 'rest'; path: string; revision: string; value: ParsedRest }
  | { kind: 'graphql'; path: string; revision: string; value: ParsedGraphQL }
  | { kind: 'sse'; path: string; revision: string; value: ParsedSse }
  | { kind: 'environment'; path: string; revision: string; value: ParsedEnvironment }
  | { kind: 'smtp'; path: string; revision: string; value: ParsedSmtp };

interface ParsedWorkspace {
  blocks: {
    metadata: { id: string; name: string; version: number };
    snapshot: number;
    groups: Record<
      string,
      {
        id: string;
        name: string;
        entity: WorkspaceGroup['entityKind'];
        parentId: string | null;
        workspaceId: string;
        script?: string | null;
      }
    >;
    script?: string | null;
  };
}

interface ParsedRequestEntity {
  blocks: {
    metadata: { id: string; name: string; groupId: string | null };
    request: {
      url: string | null;
      headers: TabularValue[];
      parameters: TabularValue[];
      searchParameters: TabularValue[];
      body: { type: string; content: string | null } | null;
    };
    dependencies: string[];
    script: string | null;
    test: string | null;
  };
}

interface ParsedRest extends ParsedRequestEntity {
  blocks: ParsedRequestEntity['blocks'] & { metadata: ParsedRequestEntity['blocks']['metadata'] & { method: string } };
}

interface ParsedGraphQL extends ParsedRequestEntity {}

interface ParsedSse extends ParsedRequestEntity {
  blocks: ParsedRequestEntity['blocks'] & {
    metadata: ParsedRequestEntity['blocks']['metadata'] & { method: string };
    events: string[];
    reconnect: { enabled: boolean; retryMs: number };
  };
}

interface ParsedEnvironment {
  blocks: {
    metadata: { id: string; name: string };
    variables: TabularValue[];
    secrets: TabularValue[];
  };
}

interface ParsedSmtp {
  blocks: {
    metadata: { id: string; port: number; username: string | null; password: string | null };
    script: string | null;
  };
}

export interface WorkspaceLoadResult {
  workspace?: YasumuWorkspace;
  diagnostics: Diagnostic[];
  revisions: Record<string, string>;
}

export class HeadlessWorkspaceLoader {
  private readonly cache = new Map<string, { revision: string; parsed: ParsedFile }>();

  async load(source: WorkspaceSource): Promise<WorkspaceLoadResult> {
    const diagnostics: Diagnostic[] = [];
    const files = (await source.list())
      .filter((file) => file.path.endsWith('.ysl'))
      .sort((a, b) => a.path.localeCompare(b.path));
    const parsed: ParsedFile[] = [];

    for (const file of files) {
      try {
        parsed.push(this.parseFile(file));
      } catch (error) {
        diagnostics.push(diagnosticFromParseError(file.path, error));
      }
    }

    const workspaceFiles = parsed.filter(
      (file): file is Extract<ParsedFile, { kind: 'workspace' }> => file.kind === 'workspace',
    );
    if (workspaceFiles.length === 0) {
      diagnostics.push({
        code: YasumuErrorCodes.WorkspaceNotFound,
        message: 'workspace.ysl was not found',
        severity: 'error',
        file: source.root ? `${source.root}/workspace.ysl` : 'workspace.ysl',
      });
      return { diagnostics, revisions: revisionsOf(parsed) };
    }
    if (workspaceFiles.length > 1) {
      diagnostics.push({
        code: YasumuErrorCodes.InvalidYsl,
        message: 'A workspace source must contain exactly one workspace.ysl file',
        severity: 'error',
      });
    }

    const workspaceFile = workspaceFiles[0]!;
    const workspace = normalizeWorkspace(workspaceFile, parsed, source.root, diagnostics);
    validateWorkspace(workspace, diagnostics);

    return {
      workspace: diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? undefined : workspace,
      diagnostics,
      revisions: revisionsOf(parsed),
    };
  }

  async loadOrThrow(source: WorkspaceSource): Promise<YasumuWorkspace> {
    const result = await this.load(source);
    if (!result.workspace) {
      throw new WorkspaceValidationError('The Yasumu workspace is invalid', result.diagnostics);
    }
    return result.workspace;
  }

  private parseFile(file: WorkspaceSourceFile): ParsedFile {
    const revision = file.revision ?? stableHash(file.content);
    const cached = this.cache.get(file.path);
    if (cached?.revision === revision) return cached.parsed;

    const annotation = file.content.match(/^\s*@([A-Za-z][A-Za-z0-9_-]*)/)?.[1];
    let parsed: ParsedFile;
    switch (annotation) {
      case 'workspace':
        parsed = {
          kind: 'workspace',
          path: file.path,
          revision,
          value: deserialize(file.content, WorkspaceSchema) as ParsedWorkspace,
        };
        break;
      case 'rest':
        parsed = {
          kind: 'rest',
          path: file.path,
          revision,
          value: deserialize(file.content, RestSchema) as ParsedRest,
        };
        break;
      case 'graphql':
        parsed = {
          kind: 'graphql',
          path: file.path,
          revision,
          value: deserialize(file.content, GraphqlSchema) as ParsedGraphQL,
        };
        break;
      case 'sse':
        parsed = {
          kind: 'sse',
          path: file.path,
          revision,
          value: deserialize(file.content, SseSchema) as ParsedSse,
        };
        break;
      case 'environment':
        parsed = {
          kind: 'environment',
          path: file.path,
          revision,
          value: deserialize(file.content, EnvironmentSchema) as ParsedEnvironment,
        };
        break;
      case 'smtp':
        parsed = {
          kind: 'smtp',
          path: file.path,
          revision,
          value: deserialize(file.content, SmtpSchema) as ParsedSmtp,
        };
        break;
      default:
        throw new Error(`Unsupported or missing Yasumu annotation${annotation ? `: @${annotation}` : ''}`);
    }
    this.cache.set(file.path, { revision, parsed });
    return parsed;
  }
}

function normalizeWorkspace(
  workspaceFile: Extract<ParsedFile, { kind: 'workspace' }>,
  files: ParsedFile[],
  root: string | undefined,
  diagnostics: Diagnostic[],
): YasumuWorkspace {
  const metadata = workspaceFile.value.blocks.metadata;
  const origin = sourceOrigin(workspaceFile);
  const groups = Object.entries(workspaceFile.value.blocks.groups).map(([key, group]) => {
    if (key !== group.id) {
      diagnostics.push({
        code: YasumuErrorCodes.InvalidYsl,
        message: `Group record key ${key} does not match group ID ${group.id}`,
        severity: 'error',
        file: workspaceFile.path,
      });
    }
    return {
      id: group.id,
      name: group.name,
      workspaceId: group.workspaceId,
      parentId: group.parentId,
      entityKind: group.entity,
      script: scriptSource(group.script, `group:${group.id}`, workspaceFile.path),
      origin,
    } satisfies WorkspaceGroup;
  });

  const entities = files.flatMap((file): ExecutableEntity[] => {
    if (file.kind === 'rest') return [normalizeRest(metadata.id, file, diagnostics)];
    if (file.kind === 'graphql') return [normalizeGraphQL(metadata.id, file, diagnostics)];
    if (file.kind === 'sse') return [normalizeSse(metadata.id, file, diagnostics)];
    return [];
  });
  const environments = files.flatMap((file): WorkspaceEnvironment[] =>
    file.kind === 'environment' ? [normalizeEnvironment(metadata.id, file, diagnostics)] : [],
  );
  const smtpFiles = files.filter((file): file is Extract<ParsedFile, { kind: 'smtp' }> => file.kind === 'smtp');
  if (smtpFiles.length > 1) {
    diagnostics.push({
      code: YasumuErrorCodes.InvalidYsl,
      message: 'Only one @smtp file is supported',
      severity: 'error',
    });
  }

  return {
    id: metadata.id,
    name: metadata.name,
    version: metadata.version,
    root,
    script: scriptSource(workspaceFile.value.blocks.script, `workspace:${metadata.id}`, workspaceFile.path),
    entities,
    groups,
    environments,
    smtp: smtpFiles[0] ? normalizeSmtp(smtpFiles[0]) : undefined,
    metadata: { sourceSnapshot: workspaceFile.value.blocks.snapshot },
    origin,
  };
}

function normalizeRest(
  workspaceId: string,
  file: Extract<ParsedFile, { kind: 'rest' }>,
  diagnostics: Diagnostic[],
): RestEntity {
  const { metadata, request, dependencies, script, test } = file.value.blocks;
  validateFileName(file.path, metadata.id, diagnostics);
  return {
    kind: 'rest',
    id: metadata.id,
    name: metadata.name,
    workspaceId,
    groupId: metadata.groupId,
    method: metadata.method.toUpperCase(),
    headers: request.headers,
    pathParameters: request.parameters,
    searchParameters: request.searchParameters,
    url: request.url,
    body: normalizeRestBody(request.body, file.path, diagnostics),
    scripts: {
      lifecycle: scriptSource(script, `rest:${metadata.id}:lifecycle`, file.path),
      test: scriptSource(test, `rest:${metadata.id}:test`, file.path),
    },
    dependencies,
    metadata: {},
    origin: sourceOrigin(file),
  };
}

function normalizeGraphQL(
  workspaceId: string,
  file: Extract<ParsedFile, { kind: 'graphql' }>,
  diagnostics: Diagnostic[],
): GraphQLEntity {
  const { metadata, request, dependencies, script, test } = file.value.blocks;
  validateFileName(file.path, metadata.id, diagnostics);
  return {
    kind: 'graphql',
    id: metadata.id,
    name: metadata.name,
    workspaceId,
    groupId: metadata.groupId,
    headers: request.headers,
    pathParameters: request.parameters,
    searchParameters: request.searchParameters,
    url: request.url,
    body: normalizeGraphQLBody(request.body, file.path, diagnostics),
    scripts: {
      lifecycle: scriptSource(script, `graphql:${metadata.id}:lifecycle`, file.path),
      test: scriptSource(test, `graphql:${metadata.id}:test`, file.path),
    },
    dependencies,
    metadata: {},
    origin: sourceOrigin(file),
  };
}

function normalizeSse(
  workspaceId: string,
  file: Extract<ParsedFile, { kind: 'sse' }>,
  diagnostics: Diagnostic[],
): SseEntity {
  const { metadata, request, events, reconnect, dependencies, script, test } = file.value.blocks;
  validateFileName(file.path, metadata.id, diagnostics);
  return {
    kind: 'sse',
    id: metadata.id,
    name: metadata.name,
    workspaceId,
    groupId: metadata.groupId,
    method: metadata.method.toUpperCase(),
    headers: request.headers,
    pathParameters: request.parameters,
    searchParameters: request.searchParameters,
    url: request.url,
    body: normalizeRestBody(request.body, file.path, diagnostics),
    eventTypes: events,
    reconnect,
    scripts: {
      lifecycle: scriptSource(script, `sse:${metadata.id}:lifecycle`, file.path),
      test: scriptSource(test, `sse:${metadata.id}:test`, file.path),
    },
    dependencies,
    metadata: {},
    origin: sourceOrigin(file),
  };
}

function normalizeEnvironment(
  workspaceId: string,
  file: Extract<ParsedFile, { kind: 'environment' }>,
  diagnostics: Diagnostic[],
): WorkspaceEnvironment {
  const { metadata, variables, secrets } = file.value.blocks;
  validateFileName(file.path, metadata.id, diagnostics);
  return {
    id: metadata.id,
    name: metadata.name,
    workspaceId,
    variables: variables.map((entry) => ({ ...entry, value: entry.value })),
    secrets: secrets.map((entry) => ({ key: entry.key, enabled: entry.enabled })),
    origin: sourceOrigin(file),
  };
}

function normalizeSmtp(file: Extract<ParsedFile, { kind: 'smtp' }>): WorkspaceSmtpConfiguration {
  const { metadata, script } = file.value.blocks;
  return {
    id: metadata.id,
    port: metadata.port,
    username: metadata.username,
    password: metadata.password,
    script: scriptSource(script, `smtp:${metadata.id}`, file.path),
    origin: sourceOrigin(file),
  };
}

function normalizeRestBody(
  body: ParsedRequestEntity['blocks']['request']['body'],
  file: string,
  diagnostics: Diagnostic[],
): RequestBody | null {
  if (!body) return null;
  const content = body.content ?? '';
  switch (body.type) {
    case 'json':
      return { type: 'json', value: parseJsonOrString(content) };
    case 'text':
      return { type: 'text', value: content };
    case 'binary':
      return {
        type: 'binary',
        value: content ? workspacePathFile(content) : null,
      };
    case 'form-data':
      return { type: 'form-data', value: normalizeFormData(parseJsonOrString(content), file, diagnostics) };
    case 'x-www-form-urlencoded':
      return { type: 'x-www-form-urlencoded', value: normalizeTabular(parseJsonOrString(content), file, diagnostics) };
    default:
      diagnostics.push({
        code: YasumuErrorCodes.InvalidEntity,
        message: `Unsupported request body type: ${body.type}`,
        severity: 'error',
        file,
      });
      return null;
  }
}

function normalizeGraphQLBody(
  body: ParsedRequestEntity['blocks']['request']['body'],
  file: string,
  diagnostics: Diagnostic[],
): GraphQLBody {
  if (!body?.content) return { query: '' };
  const value = parseJsonOrString(body.content);
  if (typeof value === 'string') return { query: value };
  if (value && typeof value === 'object' && !Array.isArray(value) && typeof value.query === 'string') {
    const variables = value.variables;
    if (variables !== undefined && variables !== null && (typeof variables !== 'object' || Array.isArray(variables))) {
      diagnostics.push({
        code: YasumuErrorCodes.InvalidEntity,
        message: 'GraphQL variables must be an object, string, or null',
        severity: 'error',
        file,
      });
    }
    return {
      query: value.query,
      variables: variables as GraphQLBody['variables'],
      operationName: typeof value.operationName === 'string' ? value.operationName : null,
    };
  }
  diagnostics.push({
    code: YasumuErrorCodes.InvalidEntity,
    message: 'GraphQL body must contain a query',
    severity: 'error',
    file,
  });
  return { query: '' };
}

function normalizeFormData(value: JsonValue, file: string, diagnostics: Diagnostic[]): FormDataEntry[] {
  if (!Array.isArray(value)) {
    diagnostics.push({
      code: YasumuErrorCodes.InvalidEntity,
      message: 'Form data must be an array',
      severity: 'error',
      file,
    });
    return [];
  }
  return value.flatMap((entry): FormDataEntry[] => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || typeof entry.key !== 'string') return [];
    if (entry.kind === 'file' || (entry.file && typeof entry.file === 'object')) {
      const reference = normalizeFileReference(entry.file ?? entry.value);
      return reference ? [{ kind: 'file', key: entry.key, file: reference, enabled: entry.enabled !== false }] : [];
    }
    return [
      {
        kind: 'text',
        key: entry.key,
        value: typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value ?? ''),
        enabled: entry.enabled !== false,
      },
    ];
  });
}

function normalizeTabular(value: JsonValue, file: string, diagnostics: Diagnostic[]): TabularValue[] {
  if (!Array.isArray(value)) {
    diagnostics.push({
      code: YasumuErrorCodes.InvalidEntity,
      message: 'URL-encoded form data must be an array',
      severity: 'error',
      file,
    });
    return [];
  }
  return value.flatMap((entry): TabularValue[] =>
    entry && typeof entry === 'object' && !Array.isArray(entry) && typeof entry.key === 'string'
      ? [
          {
            key: entry.key,
            value: typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value ?? ''),
            enabled: entry.enabled !== false,
          },
        ]
      : [],
  );
}

function normalizeFileReference(value: JsonValue | undefined): YasumuFileReference | null {
  if (typeof value === 'string') return workspacePathFile(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (typeof value.path === 'string')
    return workspacePathFile(value.path, typeof value.name === 'string' ? value.name : undefined);
  return null;
}

function workspacePathFile(path: string, name?: string): YasumuFileReference {
  const parts = path.split(/[\\/]/);
  const inferredName = name ?? parts[parts.length - 1] ?? 'file';
  return { id: `workspace:${path}`, name: inferredName, source: { type: 'workspace-path', path } };
}

function parseJsonOrString(content: string): JsonValue {
  if (!content.trim()) return '';
  try {
    return JSON.parse(content) as JsonValue;
  } catch {
    return content;
  }
}

function scriptSource(code: string | null | undefined, id: string, sourceUrl: string): ScriptSource | undefined {
  return code?.trim() ? { id, code, sourceUrl } : undefined;
}

function sourceOrigin(file: ParsedFile): SourceOrigin {
  return { kind: 'ysl', path: file.path, revision: file.revision, importedRevision: file.revision };
}

function validateFileName(path: string, id: string, diagnostics: Diagnostic[]): void {
  const parts = path.split(/[\\/]/);
  const fileName = parts[parts.length - 1];
  if (fileName !== `${id}.ysl`) {
    diagnostics.push({
      code: YasumuErrorCodes.InvalidYsl,
      message: `Entity file ${fileName ?? path} must be named ${id}.ysl to preserve stable identity`,
      severity: 'error',
      file: path,
      entityId: id,
    });
  }
}

function validateWorkspace(workspace: YasumuWorkspace, diagnostics: Diagnostic[]): void {
  const ids = new Map<string, string>();
  const register = (id: string, kind: string, file?: string) => {
    const previous = ids.get(id);
    if (previous) {
      diagnostics.push({
        code: YasumuErrorCodes.DuplicateEntityId,
        message: `Duplicate ID ${id} is used by ${previous} and ${kind}`,
        severity: 'error',
        file,
        entityId: id,
      });
    } else ids.set(id, kind);
  };
  register(workspace.id, 'workspace', workspace.origin.path);
  for (const group of workspace.groups) register(group.id, 'group', group.origin.path);
  for (const environment of workspace.environments) register(environment.id, 'environment', environment.origin.path);
  for (const entity of workspace.entities) register(entity.id, entity.kind, entity.origin.path);
  if (workspace.smtp) register(workspace.smtp.id, 'smtp', workspace.smtp.origin.path);

  const groups = new Map(workspace.groups.map((group) => [group.id, group]));
  for (const group of workspace.groups) {
    if (group.workspaceId !== workspace.id)
      invalidReference(`Group ${group.id} has the wrong workspace ID`, group.id, diagnostics, group.origin.path);
    if (group.parentId && !groups.has(group.parentId))
      invalidReference(
        `Group ${group.id} references unknown parent ${group.parentId}`,
        group.id,
        diagnostics,
        group.origin.path,
      );
    const seen = new Set<string>([group.id]);
    let parent = group.parentId;
    while (parent) {
      if (seen.has(parent)) {
        invalidReference(`Group cycle detected at ${parent}`, group.id, diagnostics, group.origin.path);
        break;
      }
      seen.add(parent);
      parent = groups.get(parent)?.parentId ?? null;
    }
  }

  const entityIds = new Set(workspace.entities.map((entity) => entity.id));
  for (const entity of workspace.entities) {
    if (entity.groupId) {
      const group = groups.get(entity.groupId);
      if (!group)
        invalidReference(
          `Entity ${entity.id} references unknown group ${entity.groupId}`,
          entity.id,
          diagnostics,
          entity.origin.path,
        );
      else if (group.entityKind !== entity.kind)
        invalidReference(
          `Entity ${entity.id} is assigned to a ${group.entityKind} group`,
          entity.id,
          diagnostics,
          entity.origin.path,
        );
    }
    for (const dependency of entity.dependencies) {
      if (!entityIds.has(dependency))
        invalidReference(
          `Entity ${entity.id} references unknown dependency ${dependency}`,
          entity.id,
          diagnostics,
          entity.origin.path,
        );
    }
  }
}

function invalidReference(message: string, entityId: string, diagnostics: Diagnostic[], file?: string): void {
  diagnostics.push({ code: YasumuErrorCodes.InvalidReference, message, severity: 'error', entityId, file });
}

function diagnosticFromParseError(file: string, error: unknown): Diagnostic {
  const record = error && typeof error === 'object' ? (error as Record<string, unknown>) : undefined;
  const range = isSourceRange(record?.range)
    ? record.range
    : rangeFromMessage(error instanceof Error ? error.message : '');
  return {
    code: YasumuErrorCodes.InvalidYsl,
    message: error instanceof Error ? error.message : String(error),
    severity: 'error',
    file,
    range,
  };
}

function isSourceRange(value: unknown): value is SourceRange {
  if (!value || typeof value !== 'object') return false;
  const range = value as Record<string, unknown>;
  return isPosition(range.start) && isPosition(range.end);
}

function isPosition(value: unknown): value is SourceRange['start'] {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>).line === 'number' &&
    typeof (value as Record<string, unknown>).column === 'number'
  );
}

function rangeFromMessage(message: string): SourceRange | undefined {
  const match = message.match(/at line (\d+), column (\d+)/);
  if (!match) return undefined;
  const position = { line: Number(match[1]), column: Number(match[2]) };
  return { start: position, end: position };
}

function revisionsOf(files: ParsedFile[]): Record<string, string> {
  return Object.fromEntries(files.map((file) => [file.path, file.revision]));
}
