import { YasumuScriptingLanguage } from '@yasumu/common';
import type { DenApplication } from '@yasumu/den';
import type { ExecuteEntityInput } from '@yasumu/headless';
import type { JsonValue } from '@yasumu/runtime-api';
import { Hono } from 'hono';

import { runInTransaction } from '../database/index.ts';

type JsonRpcRequest = {
  jsonrpc?: '2.0';
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse =
  | {
      jsonrpc: '2.0';
      id: string | number | null;
      result: unknown;
    }
  | {
      jsonrpc: '2.0';
      id: string | number | null;
      error: {
        code: number;
        message: string;
      };
    };

type ToolInput = Record<string, unknown>;

type WorkspaceReference = {
  id: string;
  name: string;
  path: string;
};

type JsonSchemaObject = {
  type: 'object';
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
};

type RpcExecute = (
  action: string,
  payload: unknown[],
  workspaceId?: string | null,
  type?: 'query' | 'mutation',
) => Promise<unknown>;

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchemaObject;
  call(input: ToolInput, signal?: AbortSignal): Promise<unknown>;
}

class ToolInputError extends Error {
  readonly code = 'MCP_INVALID_TOOL_INPUT';

  constructor(
    message: string,
    readonly details?: Record<string, JsonValue>,
  ) {
    super(message);
    this.name = 'ToolInputError';
  }
}

function textResult(value: unknown, isError = false) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return {
    content: [
      {
        type: 'text',
        text: serialized ?? 'null',
      },
    ],
    ...(isError ? { isError: true } : {}),
  };
}

function toolErrorResult(error: unknown) {
  const details = isRecord(error) && isRecord(error.details) ? error.details : undefined;
  const code = isRecord(error) && typeof error.code === 'string' ? error.code : 'MCP_TOOL_ERROR';
  const message = error instanceof Error ? error.message : String(error);

  return textResult(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    true,
  );
}

function isNotification(request: JsonRpcRequest) {
  return !Object.hasOwn(request, 'id');
}

function jsonRpcResult(id: JsonRpcRequest['id'], result: unknown): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    result,
  };
}

function jsonRpcError(id: JsonRpcRequest['id'], code: number, message: string): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code,
      message,
    },
  };
}

function createSseStream() {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(': yasumu-mcp\n\n'));
      interval = setInterval(() => {
        controller.enqueue(encoder.encode(': keepalive\n\n'));
      }, 15_000);
    },
    cancel() {
      if (interval !== undefined) {
        clearInterval(interval);
      }
    },
  });
}

function requireString(input: ToolInput, key: string) {
  const value = input[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new ToolInputError(`${key} is required`, { field: key });
  }
  return value;
}

function optionalString(input: ToolInput, key: string) {
  const value = input[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function optionalBoolean(input: ToolInput, key: string) {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    throw new ToolInputError(`${key} must be a boolean`, { field: key });
  }
  return value;
}

function optionalNumber(input: ToolInput, key: string) {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new ToolInputError(`${key} must be a non-negative finite number`, {
      field: key,
    });
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  return isRecord(value) && Object.values(value).every(isJsonValue);
}

function normalizeJsonRecord(value: unknown, field: string): Record<string, JsonValue> | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    throw new ToolInputError(`${field} must be an object`, { field });
  }

  const entries = Object.entries(value);
  for (const [key, entry] of entries) {
    if (!isJsonValue(entry)) {
      throw new ToolInputError(`${field}.${key} must be JSON-serializable`, {
        field,
        key,
      });
    }
  }

  return Object.fromEntries(entries) as Record<string, JsonValue>;
}

function normalizeSecrets(value: unknown): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    throw new ToolInputError('secrets must be an object', { field: 'secrets' });
  }

  const secrets: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string') {
      throw new ToolInputError(`secrets.${key} must be a string`, {
        field: 'secrets',
        key,
      });
    }
    secrets[key] = entry;
  }
  return secrets;
}

function normalizePathParameters(input: ToolInput): Record<string, JsonValue> | undefined {
  const value = input.pathParameters ?? input.pathParams;
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    throw new ToolInputError('pathParameters must be an object', {
      field: 'pathParameters',
    });
  }

  const parameters: Record<string, JsonValue> = {};
  for (const [key, entry] of Object.entries(value)) {
    const isLegacyEntry = isRecord(entry) && ('value' in entry || 'enabled' in entry);
    if (isLegacyEntry && entry.enabled === false) continue;
    const normalized = isLegacyEntry ? (entry.value ?? '') : entry;
    if (!isJsonValue(normalized)) {
      throw new ToolInputError(`pathParameters.${key} must be JSON-serializable`, {
        field: 'pathParameters',
        key,
      });
    }
    parameters[key] = normalized;
  }

  return parameters;
}

function normalizeMode(input: ToolInput, defaultMode: 'run' | 'test') {
  const mode = input.mode ?? defaultMode;
  if (mode !== 'run' && mode !== 'test') {
    throw new ToolInputError('mode must be either "run" or "test"', {
      field: 'mode',
    });
  }
  return mode;
}

function buildExecutionOptions(input: ToolInput): ExecuteEntityInput['options'] {
  const options: NonNullable<ExecuteEntityInput['options']> = {};
  const timeoutMs = optionalNumber(input, 'timeoutMs');
  const scriptTimeoutMs = optionalNumber(input, 'scriptTimeoutMs');
  const includeResponseBody = optionalBoolean(input, 'includeResponseBody');
  const maxRequestBodyBytes = optionalNumber(input, 'maxRequestBodyBytes');
  const maxResponseBodyBytes = optionalNumber(input, 'maxResponseBodyBytes');
  const followRedirects = optionalBoolean(input, 'followRedirects');
  const maxEvents = optionalNumber(input, 'maxEvents');

  if (timeoutMs !== undefined) options.timeoutMs = timeoutMs;
  if (scriptTimeoutMs !== undefined) options.scriptTimeoutMs = scriptTimeoutMs;
  if (includeResponseBody !== undefined) {
    options.includeResponseBody = includeResponseBody;
  }
  if (maxRequestBodyBytes !== undefined) {
    options.maxRequestBodyBytes = maxRequestBodyBytes;
  }
  if (maxResponseBodyBytes !== undefined) {
    options.maxResponseBodyBytes = maxResponseBodyBytes;
  }
  if (followRedirects !== undefined) options.followRedirects = followRedirects;
  if (maxEvents !== undefined) options.maxEvents = maxEvents;

  return Object.keys(options).length > 0 ? options : undefined;
}

function normalizeWorkspaceReference(value: string) {
  return value.trim().toLowerCase();
}

function getPathName(path: string) {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path;
}

async function findWorkspaceByReference(
  rpcServer: DenApplication,
  reference: string,
): Promise<WorkspaceReference | null> {
  const direct = await rpcServer
    .execute({
      type: 'query',
      action: 'workspaces.get',
      payload: [reference],
    })
    .catch(() => null);

  if (direct && typeof direct === 'object' && 'id' in direct) {
    return direct as WorkspaceReference;
  }

  const workspaces = (await rpcServer.execute({
    type: 'query',
    action: 'workspaces.list',
    payload: [{ take: 100 }],
  })) as WorkspaceReference[];
  const normalizedReference = normalizeWorkspaceReference(reference);

  return (
    workspaces.find((workspace) => {
      const candidates = [workspace.id, workspace.name, workspace.path, getPathName(workspace.path)].map(
        normalizeWorkspaceReference,
      );

      return candidates.includes(normalizedReference);
    }) ?? null
  );
}

async function resolveWorkspaceId(rpcServer: DenApplication, input: ToolInput) {
  const explicit = optionalString(input, 'workspaceId') ?? optionalString(input, 'workspace');

  if (explicit) {
    const workspace = await findWorkspaceByReference(rpcServer, explicit);

    if (!workspace) {
      throw new ToolInputError(
        `Workspace "${explicit}" was not found. Use workspaces_list and pass a workspace id, name, path, or path folder name.`,
        { workspace: explicit },
      );
    }

    return workspace.id;
  }

  const active = (await rpcServer.execute({
    type: 'query',
    action: 'workspaces.active',
    payload: [],
  })) as string | null;

  if (!active) {
    throw new ToolInputError('No active workspace. Pass workspaceId explicitly.');
  }

  return active;
}

function validateLegacyRestOverrides(input: ToolInput) {
  if (input.queryParams !== undefined && (!isRecord(input.queryParams) || Object.keys(input.queryParams).length > 0)) {
    throw new ToolInputError(
      'Per-execution queryParams overrides are not supported by the canonical execution contract. Update the saved request query parameters before executing it.',
      { field: 'queryParams' },
    );
  }

  if (input.script !== undefined && typeof input.script !== 'string') {
    throw new ToolInputError('script must be a string', { field: 'script' });
  }

  if (typeof input.script === 'string' && input.persistScript !== true) {
    throw new ToolInputError(
      'Temporary script overrides are not supported by the canonical execution contract. Set persistScript to true or call rest_update_script first.',
      { field: 'script' },
    );
  }
}

async function persistRestScript(execute: RpcExecute, workspaceId: string, input: ToolInput) {
  if (typeof input.script !== 'string') return;

  await execute(
    'rest.update',
    [
      requireString(input, 'id'),
      {
        script: {
          language: YasumuScriptingLanguage.JavaScript,
          code: input.script,
        },
      },
    ],
    workspaceId,
    'mutation',
  );
}

function getAbortReason(signal: AbortSignal) {
  if (signal.reason instanceof Error) return signal.reason.message;
  return typeof signal.reason === 'string' && signal.reason.length > 0 ? signal.reason : 'MCP request cancelled';
}

async function executeEntityTool(
  execute: RpcExecute,
  rpcServer: DenApplication,
  input: ToolInput,
  defaultMode: 'run' | 'test',
  signal?: AbortSignal,
) {
  const workspaceId = await resolveWorkspaceId(rpcServer, input);
  const executionId = optionalString(input, 'executionId') ?? crypto.randomUUID();
  const environmentId = optionalString(input, 'environmentId');
  const variables = normalizeJsonRecord(input.variables, 'variables');
  const secrets = normalizeSecrets(input.secrets);
  const pathParameters = normalizePathParameters(input);
  const options = buildExecutionOptions(input);
  const executionInput: Omit<ExecuteEntityInput, 'workspaceId' | 'signal'> = {
    entityId: requireString(input, 'id'),
    executionId,
    mode: normalizeMode(input, defaultMode),
    ...(environmentId ? { environmentId } : {}),
    ...(variables ? { variables } : {}),
    ...(secrets ? { secrets } : {}),
    ...(pathParameters ? { pathParameters } : {}),
    ...(options ? { options } : {}),
  };
  const executionPromise = execute('execution.execute', [executionInput], workspaceId, 'mutation');
  let cancellation: Promise<unknown> | undefined;
  const cancel = () => {
    cancellation ??= rpcServer
      .execute(
        {
          type: 'mutation',
          action: 'execution.cancel',
          payload: [executionId, signal ? getAbortReason(signal) : 'MCP request cancelled'],
        },
        { workspaceId },
      )
      .catch(() => false);
  };

  if (signal?.aborted) {
    cancel();
  } else {
    signal?.addEventListener('abort', cancel, { once: true });
  }

  try {
    return await executionPromise;
  } finally {
    signal?.removeEventListener('abort', cancel);
    await cancellation;
  }
}

function createTools(rpcServer: DenApplication): ToolDefinition[] {
  const execute = (
    action: string,
    payload: unknown[],
    workspaceId?: string | null,
    type: 'query' | 'mutation' = 'query',
  ) =>
    runInTransaction(() =>
      rpcServer.execute(
        {
          type,
          action,
          payload,
        },
        { workspaceId: workspaceId ?? null },
      ),
    );

  const workspaceAware = async (
    input: ToolInput,
    action: string,
    payload: unknown[],
    type: 'query' | 'mutation' = 'query',
  ) => execute(action, payload, await resolveWorkspaceId(rpcServer, input), type);

  const objectSchema = (properties: Record<string, unknown>, required: string[] = []): JsonSchemaObject => ({
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  });

  const workspaceReferenceProperty = {
    type: 'string',
    description: 'Workspace id, name, path, or path folder name.',
  };

  const executionProperties = {
    workspaceId: workspaceReferenceProperty,
    id: { type: 'string', description: 'Saved entity id.' },
    executionId: {
      type: 'string',
      description: 'Optional caller-provided execution id.',
    },
    environmentId: {
      type: 'string',
      description: 'Optional environment id for this execution.',
    },
    mode: {
      type: 'string',
      enum: ['run', 'test'],
      description: 'Run the request lifecycle, or also execute test hooks.',
    },
    pathParameters: {
      type: 'object',
      description: 'Path parameter values by name.',
    },
    variables: {
      type: 'object',
      description: 'Temporary JSON interpolation variables for this execution.',
    },
    secrets: {
      type: 'object',
      description: 'Temporary string secrets for this execution. Returned results remain redacted.',
    },
    timeoutMs: {
      type: 'number',
      description: 'Overall execution timeout in milliseconds.',
    },
    scriptTimeoutMs: {
      type: 'number',
      description: 'Per-script-hook timeout in milliseconds.',
    },
    includeResponseBody: {
      type: 'boolean',
      description: 'Include the response body in the result snapshot.',
    },
    maxRequestBodyBytes: {
      type: 'number',
      description: 'Maximum request body size captured by the execution.',
    },
    maxResponseBodyBytes: {
      type: 'number',
      description: 'Maximum response body size captured by the execution.',
    },
    followRedirects: {
      type: 'boolean',
      description: 'Whether the HTTP transport should follow redirects.',
    },
    maxEvents: {
      type: 'number',
      description: 'Stop an SSE execution after this many accepted events.',
    },
  };

  return [
    {
      name: 'workspaces_list',
      description: 'List recent Yasumu workspaces.',
      inputSchema: objectSchema({ take: { type: 'number' } }),
      call: (input) =>
        execute('workspaces.list', [
          {
            take: typeof input.take === 'number' ? input.take : 20,
          },
        ]),
    },
    {
      name: 'workspaces_active',
      description: 'Return the active workspace id.',
      inputSchema: objectSchema({}),
      call: () => execute('workspaces.active', []),
    },
    {
      name: 'workspaces_get',
      description: 'Get a workspace by id.',
      inputSchema: objectSchema({ id: { type: 'string' } }, ['id']),
      call: (input) => execute('workspaces.get', [requireString(input, 'id')]),
    },
    {
      name: 'rest_list',
      description: 'List REST requests in a workspace.',
      inputSchema: objectSchema({ workspaceId: workspaceReferenceProperty }),
      call: (input) => workspaceAware(input, 'rest.list', []),
    },
    {
      name: 'rest_get',
      description: 'Get a REST request by id.',
      inputSchema: objectSchema(
        {
          workspaceId: workspaceReferenceProperty,
          id: { type: 'string' },
        },
        ['id'],
      ),
      call: (input) => workspaceAware(input, 'rest.get', [requireString(input, 'id')]),
    },
    {
      name: 'rest_create',
      description: 'Create a REST request.',
      inputSchema: objectSchema(
        {
          workspaceId: workspaceReferenceProperty,
          name: { type: 'string' },
          method: { type: 'string' },
          url: { type: 'string' },
          groupId: { type: ['string', 'null'] },
        },
        ['name', 'method'],
      ),
      call: (input) =>
        workspaceAware(
          input,
          'rest.create',
          [
            {
              name: requireString(input, 'name'),
              method: requireString(input, 'method'),
              url: optionalString(input, 'url') ?? null,
              groupId: optionalString(input, 'groupId') ?? null,
            },
          ],
          'mutation',
        ),
    },
    {
      name: 'rest_update',
      description: 'Update a REST request by id.',
      inputSchema: objectSchema(
        {
          workspaceId: workspaceReferenceProperty,
          id: { type: 'string' },
          data: { type: 'object' },
        },
        ['id', 'data'],
      ),
      call: (input) => workspaceAware(input, 'rest.update', [requireString(input, 'id'), input.data ?? {}], 'mutation'),
    },
    {
      name: 'rest_update_script',
      description:
        'Replace the JavaScript lifecycle script on a REST request. The script can define onRequest, onResponse, and onTest handlers.',
      inputSchema: objectSchema(
        {
          workspaceId: workspaceReferenceProperty,
          id: { type: 'string' },
          script: { type: 'string' },
        },
        ['id', 'script'],
      ),
      call: (input) =>
        workspaceAware(
          input,
          'rest.update',
          [
            requireString(input, 'id'),
            {
              script: {
                language: YasumuScriptingLanguage.JavaScript,
                code: requireString(input, 'script'),
              },
            },
          ],
          'mutation',
        ),
    },
    {
      name: 'rest_execute',
      description:
        'Execute a saved REST request through the canonical headless lifecycle. Defaults to test mode for compatibility; pass mode="run" to skip test hooks.',
      inputSchema: objectSchema(
        {
          ...executionProperties,
          pathParams: {
            type: 'object',
            description: 'Legacy alias for pathParameters. Values can be JSON values or { value, enabled } objects.',
          },
          queryParams: {
            type: 'object',
            description: 'Legacy field retained for compatibility; non-empty per-run overrides are not supported.',
          },
          script: {
            type: 'string',
            description: 'Optional JavaScript lifecycle script to persist before this execution.',
          },
          persistScript: {
            type: 'boolean',
            description: 'Must be true when script is provided so all hosts execute the same saved source.',
          },
        },
        ['id'],
      ),
      call: async (input, signal) => {
        validateLegacyRestOverrides(input);
        if (typeof input.script === 'string') {
          const workspaceId = await resolveWorkspaceId(rpcServer, input);
          await persistRestScript(execute, workspaceId, input);
        }
        return executeEntityTool(execute, rpcServer, input, 'test', signal);
      },
    },
    {
      name: 'rest_delete',
      description: 'Delete a REST request by id.',
      inputSchema: objectSchema(
        {
          workspaceId: workspaceReferenceProperty,
          id: { type: 'string' },
        },
        ['id'],
      ),
      call: (input) => workspaceAware(input, 'rest.delete', [requireString(input, 'id')], 'mutation'),
    },
    {
      name: 'graphql_list',
      description: 'List GraphQL requests in a workspace.',
      inputSchema: objectSchema({ workspaceId: workspaceReferenceProperty }),
      call: (input) => workspaceAware(input, 'graphql.list', []),
    },
    {
      name: 'graphql_get',
      description: 'Get a GraphQL request by id.',
      inputSchema: objectSchema(
        {
          workspaceId: workspaceReferenceProperty,
          id: { type: 'string' },
        },
        ['id'],
      ),
      call: (input) => workspaceAware(input, 'graphql.get', [requireString(input, 'id')]),
    },
    {
      name: 'graphql_create',
      description: 'Create a GraphQL request.',
      inputSchema: objectSchema(
        {
          workspaceId: workspaceReferenceProperty,
          name: { type: 'string' },
          url: { type: 'string' },
          groupId: { type: ['string', 'null'] },
        },
        ['name'],
      ),
      call: (input) =>
        workspaceAware(
          input,
          'graphql.create',
          [
            {
              name: requireString(input, 'name'),
              url: optionalString(input, 'url') ?? null,
              groupId: optionalString(input, 'groupId') ?? null,
            },
          ],
          'mutation',
        ),
    },
    {
      name: 'graphql_update',
      description: 'Update a GraphQL request by id.',
      inputSchema: objectSchema(
        {
          workspaceId: workspaceReferenceProperty,
          id: { type: 'string' },
          data: { type: 'object' },
        },
        ['id', 'data'],
      ),
      call: (input) =>
        workspaceAware(input, 'graphql.update', [requireString(input, 'id'), input.data ?? {}], 'mutation'),
    },
    {
      name: 'graphql_execute',
      description:
        'Execute a saved GraphQL request through the same canonical headless lifecycle as REST. Defaults to run mode.',
      inputSchema: objectSchema(executionProperties, ['id']),
      call: (input, signal) => executeEntityTool(execute, rpcServer, input, 'run', signal),
    },
    {
      name: 'graphql_delete',
      description: 'Delete a GraphQL request by id.',
      inputSchema: objectSchema(
        {
          workspaceId: workspaceReferenceProperty,
          id: { type: 'string' },
        },
        ['id'],
      ),
      call: (input) => workspaceAware(input, 'graphql.delete', [requireString(input, 'id')], 'mutation'),
    },
    {
      name: 'sse_list',
      description: 'List SSE streams in a workspace.',
      inputSchema: objectSchema({ workspaceId: workspaceReferenceProperty }),
      call: (input) => workspaceAware(input, 'sse.list', []),
    },
    {
      name: 'sse_get',
      description: 'Get an SSE stream by id.',
      inputSchema: objectSchema({ workspaceId: workspaceReferenceProperty, id: { type: 'string' } }, ['id']),
      call: (input) => workspaceAware(input, 'sse.get', [requireString(input, 'id')]),
    },
    {
      name: 'sse_create',
      description: 'Create an SSE stream, including its request, event filters, reconnect settings, and scripts.',
      inputSchema: objectSchema(
        {
          workspaceId: workspaceReferenceProperty,
          name: { type: 'string' },
          method: { type: 'string' },
          url: { type: ['string', 'null'] },
          groupId: { type: ['string', 'null'] },
          requestHeaders: { type: 'array' },
          requestParameters: { type: 'array' },
          searchParameters: { type: 'array' },
          requestBody: { type: ['object', 'null'] },
          eventTypes: { type: 'array' },
          reconnect: { type: 'object' },
          script: { type: ['object', 'null'] },
          testScript: { type: ['object', 'null'] },
          dependencies: { type: 'array' },
        },
        ['name'],
      ),
      call: (input) =>
        workspaceAware(
          input,
          'sse.create',
          [
            {
              name: requireString(input, 'name'),
              method: optionalString(input, 'method') ?? 'GET',
              url: optionalString(input, 'url') ?? null,
              groupId: optionalString(input, 'groupId') ?? null,
              ...(Array.isArray(input.requestHeaders) ? { requestHeaders: input.requestHeaders } : {}),
              ...(Array.isArray(input.requestParameters) ? { requestParameters: input.requestParameters } : {}),
              ...(Array.isArray(input.searchParameters) ? { searchParameters: input.searchParameters } : {}),
              ...(input.requestBody === null || isRecord(input.requestBody) ? { requestBody: input.requestBody } : {}),
              ...(Array.isArray(input.eventTypes) ? { eventTypes: input.eventTypes } : {}),
              ...(isRecord(input.reconnect) ? { reconnect: input.reconnect } : {}),
              ...(input.script === null || isRecord(input.script) ? { script: input.script } : {}),
              ...(input.testScript === null || isRecord(input.testScript) ? { testScript: input.testScript } : {}),
              ...(Array.isArray(input.dependencies) ? { dependencies: input.dependencies } : {}),
              metadata: {},
            },
          ],
          'mutation',
        ),
    },
    {
      name: 'sse_update',
      description: 'Update any persisted SSE stream field by id.',
      inputSchema: objectSchema(
        { workspaceId: workspaceReferenceProperty, id: { type: 'string' }, data: { type: 'object' } },
        ['id', 'data'],
      ),
      call: (input) => workspaceAware(input, 'sse.update', [requireString(input, 'id'), input.data ?? {}], 'mutation'),
    },
    {
      name: 'sse_execute',
      description: 'Connect to a saved SSE stream through the canonical lifecycle and collect streamed events.',
      inputSchema: objectSchema(executionProperties, ['id']),
      call: (input, signal) => executeEntityTool(execute, rpcServer, input, 'run', signal),
    },
    {
      name: 'sse_delete',
      description: 'Delete an SSE stream by id.',
      inputSchema: objectSchema({ workspaceId: workspaceReferenceProperty, id: { type: 'string' } }, ['id']),
      call: (input) => workspaceAware(input, 'sse.delete', [requireString(input, 'id')], 'mutation'),
    },
    {
      name: 'synchronization_synchronize',
      description: 'Synchronize the active or provided workspace with disk.',
      inputSchema: objectSchema({ workspaceId: workspaceReferenceProperty }),
      call: async (input) =>
        execute('synchronization.synchronize', [], await resolveWorkspaceId(rpcServer, input), 'mutation'),
    },
  ];
}

function requestKey(id: JsonRpcRequest['id']) {
  return `${typeof id}:${String(id)}`;
}

export function createMcpServer(rpcServer: DenApplication) {
  const tools = createTools(rpcServer);
  const toolMap = new Map(tools.map((tool) => [tool.name, tool]));
  const activeToolCalls = new Map<string, AbortController>();

  const processRequest = async (
    request: JsonRpcRequest,
    requestSignal?: AbortSignal,
  ): Promise<JsonRpcResponse | null> => {
    if (!request.method) {
      return isNotification(request) ? null : jsonRpcError(request.id, -32600, 'Invalid request');
    }

    if (request.method === 'notifications/cancelled') {
      const requestId = request.params?.requestId;
      if (typeof requestId === 'string' || typeof requestId === 'number' || requestId === null) {
        const reason = typeof request.params?.reason === 'string' ? request.params.reason : 'MCP request cancelled';
        activeToolCalls.get(requestKey(requestId))?.abort(new DOMException(reason, 'AbortError'));
      }
      return null;
    }

    if (isNotification(request)) {
      return null;
    }

    if (request.method === 'initialize') {
      const requestedProtocol =
        typeof request.params?.protocolVersion === 'string' ? request.params.protocolVersion : '2025-03-26';

      return jsonRpcResult(request.id, {
        protocolVersion: requestedProtocol,
        serverInfo: {
          name: 'yasumu',
          version: (globalThis as typeof globalThis & { Yasumu: { version: string } }).Yasumu.version,
        },
        capabilities: { tools: {} },
      });
    }

    if (request.method === 'ping') {
      return jsonRpcResult(request.id, {});
    }

    if (request.method === 'tools/list') {
      return jsonRpcResult(request.id, {
        tools: tools.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      });
    }

    if (request.method === 'tools/call') {
      const name = request.params?.name;
      const input = request.params?.arguments;
      if (typeof name !== 'string') {
        return jsonRpcError(request.id, -32602, 'Tool name is required');
      }
      const tool = toolMap.get(name);
      if (!tool) {
        return jsonRpcError(request.id, -32602, `Unknown tool: ${name}`);
      }

      const controller = new AbortController();
      const abortFromRequest = () => controller.abort(requestSignal?.reason);
      if (requestSignal?.aborted) {
        abortFromRequest();
      } else {
        requestSignal?.addEventListener('abort', abortFromRequest, {
          once: true,
        });
      }
      activeToolCalls.set(requestKey(request.id), controller);

      try {
        const result = await tool.call(
          input && typeof input === 'object' ? (input as ToolInput) : {},
          controller.signal,
        );
        return jsonRpcResult(request.id, textResult(result));
      } catch (error) {
        return jsonRpcResult(request.id, toolErrorResult(error));
      } finally {
        requestSignal?.removeEventListener('abort', abortFromRequest);
        activeToolCalls.delete(requestKey(request.id));
      }
    }

    if (request.method === 'resources/list') {
      return jsonRpcResult(request.id, { resources: [] });
    }

    if (request.method === 'prompts/list') {
      return jsonRpcResult(request.id, { prompts: [] });
    }

    return jsonRpcError(request.id, -32601, 'Method not found');
  };

  return new Hono()
    .get('/', (c) => {
      const accept = c.req.header('accept') ?? '';

      if (accept.includes('text/event-stream')) {
        return c.body(createSseStream(), 200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
      }

      return c.json({
        name: 'yasumu-mcp',
        transport: 'streamable-http',
        protocol: '2025-03-26',
      });
    })
    .post('/', async (c) => {
      try {
        const payload = (await c.req.json()) as JsonRpcRequest | JsonRpcRequest[];

        if (Array.isArray(payload)) {
          const responses = (
            await Promise.all(payload.map((request) => processRequest(request, c.req.raw.signal)))
          ).filter((response): response is JsonRpcResponse => !!response);

          if (responses.length === 0) {
            return c.body(null, 202);
          }

          return c.json(responses);
        }

        const response = await processRequest(payload, c.req.raw.signal);
        if (!response) {
          return c.body(null, 202);
        }

        const status = 'error' in response && response.error.code === -32601 ? 404 : 200;
        return c.json(response, status);
      } catch (error) {
        return c.json(jsonRpcError(null, -32000, error instanceof Error ? error.message : String(error)), 500);
      }
    });
}
