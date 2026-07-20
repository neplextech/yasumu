import type { EnvironmentSnapshot, JsonValue } from '@yasumu/runtime-api';

import { YasumuError, YasumuErrorCodes } from './errors.js';
import { Interpolator } from './interpolation.js';
import type {
  ExecutableEntity,
  FormDataEntry,
  GraphQLEntity,
  RequestBody,
  RestEntity,
  SseEntity,
  TabularValue,
  YasumuWorkspace,
} from './model.js';
import type { FileResolver } from './ports.js';

export interface BuildRequestOptions {
  environment: EnvironmentSnapshot;
  variables?: Record<string, JsonValue>;
  pathParameters?: Record<string, JsonValue>;
  fileResolver?: FileResolver;
  signal?: AbortSignal;
}

export async function buildEntityRequest(
  workspace: YasumuWorkspace,
  entity: ExecutableEntity,
  options: BuildRequestOptions,
): Promise<Request> {
  const interpolator = new Interpolator({
    variables: { ...options.environment.variables, ...(options.variables ?? {}) },
    secrets: options.environment.secrets,
  });
  if (entity.kind === 'graphql') return buildGraphQLRequest(workspace, entity, interpolator, options);
  const request = await buildHttpRequest(workspace, entity, interpolator, options);
  if (entity.kind === 'sse' && !request.headers.has('accept')) request.headers.set('accept', 'text/event-stream');
  return request;
}

async function buildHttpRequest(
  workspace: YasumuWorkspace,
  entity: RestEntity | SseEntity,
  interpolator: Interpolator,
  options: BuildRequestOptions,
): Promise<Request> {
  const url = buildUrl(
    entity.url,
    entity.pathParameters,
    entity.searchParameters,
    interpolator,
    options.pathParameters,
  );
  const headers = buildHeaders(entity.headers, interpolator);
  const body = await buildBody(workspace, entity.body, headers, interpolator, options.fileResolver, options.signal);
  return new Request(url, {
    method: entity.method,
    headers,
    body: canHaveBody(entity.method) ? body : undefined,
    signal: options.signal,
  });
}

async function buildGraphQLRequest(
  _workspace: YasumuWorkspace,
  entity: GraphQLEntity,
  interpolator: Interpolator,
  options: BuildRequestOptions,
): Promise<Request> {
  const url = buildUrl(
    entity.url,
    entity.pathParameters,
    entity.searchParameters,
    interpolator,
    options.pathParameters,
  );
  const headers = buildHeaders(entity.headers, interpolator);
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');

  const query = interpolator.interpolateString(entity.body.query);
  if (typeof query !== 'string' || !query.trim()) {
    throw new YasumuError(YasumuErrorCodes.InvalidEntity, `GraphQL entity ${entity.id} requires a query`, {
      workspaceId: entity.workspaceId,
      entityId: entity.id,
    });
  }

  const variables = normalizeGraphQLVariables(entity.body.variables, interpolator);
  const operationName = entity.body.operationName
    ? interpolator.interpolateString(entity.body.operationName)
    : undefined;
  if (operationName !== undefined && operationName !== null && typeof operationName !== 'string') {
    throw new YasumuError(YasumuErrorCodes.InvalidEntity, 'GraphQL operation name must be a string');
  }

  const payload: Record<string, JsonValue> = { query };
  if (variables) payload.variables = variables;
  if (operationName) payload.operationName = operationName;

  return new Request(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: options.signal,
  });
}

function buildUrl(
  value: string | null,
  configuredPathParameters: TabularValue[],
  configuredSearchParameters: TabularValue[],
  interpolator: Interpolator,
  overrides: Record<string, JsonValue> = {},
): string {
  if (!value) throw new YasumuError(YasumuErrorCodes.InvalidEntity, 'Request URL is required');
  const resolved = interpolator.interpolateString(value);
  if (typeof resolved !== 'string')
    throw new YasumuError(YasumuErrorCodes.InvalidEntity, 'Request URL must be a string');

  const configured = new Map(
    configuredPathParameters
      .filter((entry) => entry.enabled)
      .map((entry) => [entry.key, interpolator.interpolateString(entry.value)]),
  );
  let url = resolved.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (token, key: string) => {
    const parameter = overrides[key] ?? configured.get(key);
    return parameter === undefined ? token : encodeURIComponent(stringifyValue(parameter));
  });

  try {
    const parsed = new URL(url);
    for (const entry of configuredSearchParameters) {
      if (!entry.enabled || !entry.key) continue;
      parsed.searchParams.append(
        stringifyValue(interpolator.interpolateString(entry.key)),
        stringifyValue(interpolator.interpolateString(entry.value)),
      );
    }
    url = parsed.toString();
  } catch (error) {
    throw new YasumuError(YasumuErrorCodes.InvalidEntity, `Invalid request URL: ${url}`, { cause: error });
  }
  return url;
}

function buildHeaders(entries: TabularValue[], interpolator: Interpolator): Headers {
  const headers = new Headers({ 'user-agent': 'Yasumu/1.0' });
  for (const entry of entries) {
    if (!entry.enabled || !entry.key) continue;
    headers.append(
      stringifyValue(interpolator.interpolateString(entry.key)),
      stringifyValue(interpolator.interpolateString(entry.value)),
    );
  }
  return headers;
}

async function buildBody(
  workspace: YasumuWorkspace,
  body: RequestBody | null,
  headers: Headers,
  interpolator: Interpolator,
  files?: FileResolver,
  signal?: AbortSignal,
): Promise<BodyInit | null> {
  if (!body) return null;
  switch (body.type) {
    case 'json': {
      if (!headers.has('content-type')) headers.set('content-type', 'application/json');
      const value =
        typeof body.value === 'string'
          ? parseOrInterpolateJson(body.value, interpolator)
          : interpolator.interpolate(body.value);
      return JSON.stringify(value);
    }
    case 'text':
      if (!headers.has('content-type')) headers.set('content-type', 'text/plain');
      return stringifyValue(interpolator.interpolateString(body.value));
    case 'binary': {
      if (!body.value) return null;
      if (!files) throw new YasumuError(YasumuErrorCodes.FileAccessDenied, 'No file resolver is configured');
      const opened = await files.open(workspace, body.value, signal);
      if (!headers.has('content-type')) headers.set('content-type', opened.file.mimeType ?? 'application/octet-stream');
      return opened.blob;
    }
    case 'form-data': {
      const form = new FormData();
      for (const entry of body.value) await appendFormEntry(form, workspace, entry, interpolator, files, signal);
      headers.delete('content-type');
      return form;
    }
    case 'x-www-form-urlencoded': {
      const parameters = new URLSearchParams();
      for (const entry of body.value) {
        if (!entry.enabled || !entry.key) continue;
        parameters.append(
          stringifyValue(interpolator.interpolateString(entry.key)),
          stringifyValue(interpolator.interpolateString(entry.value)),
        );
      }
      if (!headers.has('content-type')) headers.set('content-type', 'application/x-www-form-urlencoded');
      return parameters;
    }
  }
}

async function appendFormEntry(
  form: FormData,
  workspace: YasumuWorkspace,
  entry: FormDataEntry,
  interpolator: Interpolator,
  files?: FileResolver,
  signal?: AbortSignal,
): Promise<void> {
  if (!entry.enabled || !entry.key) return;
  const key = stringifyValue(interpolator.interpolateString(entry.key));
  if (entry.kind === 'text') {
    form.append(key, stringifyValue(interpolator.interpolateString(entry.value)));
    return;
  }
  if (!files) throw new YasumuError(YasumuErrorCodes.FileAccessDenied, 'No file resolver is configured');
  const opened = await files.open(workspace, entry.file, signal);
  form.append(key, opened.blob, opened.file.name);
}

function normalizeGraphQLVariables(
  value: GraphQLEntity['body']['variables'],
  interpolator: Interpolator,
): Record<string, JsonValue> | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return interpolator.interpolate(value);
  const exact = interpolator.interpolateString(value);
  if (typeof exact === 'object' && exact !== null && !Array.isArray(exact)) return exact;
  if (typeof exact !== 'string') {
    throw new YasumuError(YasumuErrorCodes.InvalidEntity, 'GraphQL variables must be an object');
  }
  try {
    // Parse before interpolating so quoted expressions preserve JSON validity and
    // whole-value expressions retain their native type.
    const parsed = JSON.parse(value) as JsonValue;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    return interpolator.interpolate(parsed);
  } catch (error) {
    throw new YasumuError(YasumuErrorCodes.InvalidEntity, 'GraphQL variables must be a JSON object', { cause: error });
  }
}

function parseOrInterpolateJson(value: string, interpolator: Interpolator): JsonValue {
  try {
    return interpolator.interpolate(JSON.parse(value) as JsonValue);
  } catch {
    // Templates such as {"count": {{count}}} only become valid JSON after interpolation.
  }
  const exact = interpolator.interpolateString(value);
  if (typeof exact !== 'string') return exact;
  try {
    return JSON.parse(exact) as JsonValue;
  } catch {
    return exact;
  }
}

function stringifyValue(value: JsonValue): string {
  if (typeof value === 'string') return value;
  if (value === null) return 'null';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function canHaveBody(method: string): boolean {
  const normalized = method.toUpperCase();
  return normalized !== 'GET' && normalized !== 'HEAD';
}
