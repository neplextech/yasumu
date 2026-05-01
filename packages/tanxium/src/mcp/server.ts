import { Hono } from 'hono';
import {
  YasumuScriptingLanguage,
  type EnvironmentData,
  type RestEntityData,
  type RestEntityRequestBody,
  type RestScriptContext,
  type ScriptExecutionResult,
  type TabularPair,
  type TestResult,
  type YasumuEmbeddedScript,
} from '@yasumu/common';
import type { DenApplication } from '@yasumu/den';
import { runInTransaction } from '../database/index.ts';

const MAX_BINARY_BODY_SIZE = 10 * 1024 * 1024;
const MAX_TEXT_BODY_SIZE = 1 * 1024 * 1024;

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

type RestResponseBodyType = 'text' | 'binary';

type RestExecutionResponse = {
  status: number;
  statusText: string;
  time: number;
  headers: Record<string, string>;
  cookies: string[];
  textBody: string | null;
  bodyType: RestResponseBodyType;
  size: number;
  bodyTruncated: boolean;
};

type RestRequestOutcome =
  | { response: RestExecutionResponse; error: null }
  | { response: null; error: string };

type ScriptSummary = {
  success: boolean;
  error: string | null;
  result: unknown;
};

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchemaObject;
  call(input: ToolInput): Promise<unknown>;
}

function textResult(value: unknown) {
  return {
    content: [
      {
        type: 'text',
        text:
          typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

function isNotification(request: JsonRpcRequest) {
  return !Object.hasOwn(request, 'id');
}

function jsonRpcResult(
  id: JsonRpcRequest['id'],
  result: unknown,
): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    result,
  };
}

function jsonRpcError(
  id: JsonRpcRequest['id'],
  code: number,
  message: string,
): JsonRpcResponse {
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
  let interval: number | undefined;

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
    throw new Error(`${key} is required`);
  }
  return value;
}

function optionalString(input: ToolInput, key: string) {
  const value = input[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
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
      const candidates = [
        workspace.id,
        workspace.name,
        workspace.path,
        getPathName(workspace.path),
      ].map(normalizeWorkspaceReference);

      return candidates.includes(normalizedReference);
    }) ?? null
  );
}

async function resolveWorkspaceId(rpcServer: DenApplication, input: ToolInput) {
  const explicit =
    optionalString(input, 'workspaceId') ?? optionalString(input, 'workspace');

  if (explicit) {
    const workspace = await findWorkspaceByReference(rpcServer, explicit);

    if (!workspace) {
      throw new Error(
        `Workspace "${explicit}" was not found. Use workspaces_list and pass a workspace id, name, path, or path folder name.`,
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
    throw new Error('No active workspace. Pass workspaceId explicitly.');
  }

  return active;
}

function optionalBoolean(input: ToolInput, key: string) {
  const value = input[key];
  return typeof value === 'boolean' ? value : undefined;
}

function optionalNumber(input: ToolInput, key: string) {
  const value = input[key];
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizePathParams(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (isRecord(entry)) {
        return [
          key,
          {
            value: String(entry.value ?? ''),
            enabled: entry.enabled !== false,
          },
        ];
      }

      return [
        key,
        {
          value: entry === null || entry === undefined ? '' : String(entry),
          enabled: true,
        },
      ];
    }),
  ) as Record<string, { value: string; enabled: boolean }>;
}

function normalizeVariables(value: unknown) {
  if (!isRecord(value)) {
    return new Map<string, string>();
  }

  return new Map(
    Object.entries(value).map(([key, entry]) => [
      key,
      entry === null || entry === undefined ? '' : String(entry),
    ]),
  );
}

function buildInterpolationMap(
  environment: EnvironmentData | null,
  overrides: unknown,
) {
  const values = new Map<string, string>();

  for (const pair of environment?.variables ?? []) {
    if (pair.enabled && pair.key) {
      values.set(pair.key, pair.value);
    }
  }

  for (const pair of environment?.secrets ?? []) {
    if (pair.enabled && pair.key) {
      values.set(pair.key, pair.value);
    }
  }

  for (const [key, value] of normalizeVariables(overrides)) {
    values.set(key, value);
  }

  return values;
}

function interpolateString(value: string, values: Map<string, string>) {
  return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key: string) => {
    const replacement = values.get(key.trim());
    return replacement ?? match;
  });
}

function createInterpolator(values: Map<string, string>) {
  return (value: string) => interpolateString(value, values);
}

function getWorkspaceContext(workspace: WorkspaceReference) {
  return {
    id: workspace.id,
    name: workspace.name,
    path: workspace.path,
  };
}

function buildRequestHeaders(
  pairs: TabularPair[] | undefined,
  interpolate: (value: string) => string,
) {
  return Object.fromEntries(
    (pairs ?? [])
      .filter((pair) => pair.enabled && pair.key)
      .map((pair) => [interpolate(pair.key), interpolate(pair.value)]),
  );
}

function buildPathParameterValues(
  pathParams: Record<string, { value: string; enabled: boolean }>,
  interpolate: (value: string) => string,
) {
  return Object.fromEntries(
    Object.entries(pathParams)
      .filter(([, param]) => param.enabled)
      .map(([key, param]) => [key, interpolate(param.value)]),
  );
}

function buildScript(input: ToolInput, entity: RestEntityData) {
  const scriptCode = optionalString(input, 'script');

  if (!scriptCode) {
    return (
      entity.script ?? {
        language: YasumuScriptingLanguage.JavaScript,
        code: '',
      }
    );
  }

  return {
    language: YasumuScriptingLanguage.JavaScript,
    code: scriptCode,
  } satisfies YasumuEmbeddedScript;
}

function summarizeScriptResult(
  result: ScriptExecutionResult<RestScriptContext> | null,
): ScriptSummary | null {
  if (!result) {
    return null;
  }

  if (result.result.success) {
    return {
      success: true,
      error: null,
      result: result.result.result ?? null,
    };
  }

  return {
    success: false,
    error: result.result.error,
    result: null,
  };
}

async function executeRestScript(
  execute: RpcExecute,
  workspaceId: string,
  entityId: string,
  script: YasumuEmbeddedScript,
  invocationTarget: 'onRequest' | 'onResponse' | 'onTest',
  context: RestScriptContext,
) {
  return (await execute(
    'rest.executeScript',
    [
      {
        entityId,
        script,
        invocationTarget,
        context,
      },
    ],
    workspaceId,
    'mutation',
  )) as ScriptExecutionResult<RestScriptContext>;
}

function isTextContentType(contentType: string) {
  const normalized = contentType.toLowerCase();
  return (
    normalized.startsWith('text/') ||
    normalized.includes('json') ||
    normalized.includes('xml') ||
    normalized.includes('javascript') ||
    normalized.includes('css') ||
    normalized.includes('html') ||
    normalized.includes('csv')
  );
}

function extractCookies(headers: Headers): string[] {
  const withSetCookie = headers as Headers & { getSetCookie?: () => string[] };

  if (typeof withSetCookie.getSetCookie === 'function') {
    return withSetCookie.getSetCookie();
  }

  const setCookie = headers.get('set-cookie');
  return setCookie ? [setCookie] : [];
}

function replacePathParams(
  pathname: string,
  pathParams: Record<string, { value: string; enabled: boolean }>,
  interpolate: (value: string) => string,
) {
  return pathname.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, key) => {
    const param = pathParams[key];
    return param?.enabled && param.value
      ? encodeURIComponent(interpolate(param.value))
      : match;
  });
}

function appendQueryParams(
  url: URL,
  pairs: TabularPair[] | undefined,
  extraParams: unknown,
  interpolate: (value: string) => string,
) {
  for (const pair of pairs ?? []) {
    if (pair.enabled && pair.key) {
      url.searchParams.append(interpolate(pair.key), interpolate(pair.value));
    }
  }

  if (!isRecord(extraParams)) {
    return;
  }

  for (const [key, value] of Object.entries(extraParams)) {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  }
}

function buildUrl(
  entity: RestEntityData,
  pathParams: Record<string, { value: string; enabled: boolean }>,
  queryParams: unknown,
  interpolate: (value: string) => string,
) {
  const rawUrl = interpolate(entity.url ?? '');

  if (!rawUrl) {
    throw new Error('URL is required');
  }

  const url = new URL(rawUrl);
  url.pathname = replacePathParams(url.pathname, pathParams, interpolate);
  appendQueryParams(url, entity.searchParameters, queryParams, interpolate);
  return url.toString();
}

function buildRequestBody(
  body: RestEntityRequestBody | null,
  headers: Headers,
  interpolate: (value: string) => string,
): BodyInit | undefined {
  if (!body) {
    return undefined;
  }

  const { type, value } = body;

  if (type === 'json') {
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    return typeof value === 'string'
      ? interpolate(value)
      : JSON.stringify(value);
  }

  if (type === 'text') {
    if (!headers.has('content-type')) {
      headers.set('content-type', 'text/plain');
    }
    return typeof value === 'string' ? interpolate(value) : String(value);
  }

  if (type === 'form-data' && Array.isArray(value)) {
    const formData = new FormData();
    for (const pair of value as TabularPair[]) {
      if (pair.enabled && pair.key) {
        formData.append(interpolate(pair.key), interpolate(pair.value));
      }
    }
    headers.delete('content-type');
    return formData;
  }

  if (type === 'x-www-form-urlencoded' && Array.isArray(value)) {
    const params = new URLSearchParams();
    for (const pair of value as TabularPair[]) {
      if (pair.enabled && pair.key) {
        params.append(interpolate(pair.key), interpolate(pair.value));
      }
    }
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/x-www-form-urlencoded');
    }
    return params;
  }

  if (type === 'binary') {
    return undefined;
  }

  return undefined;
}

async function executeHttpRequest(
  entity: RestEntityData,
  pathParams: Record<string, { value: string; enabled: boolean }>,
  queryParams: unknown,
  timeoutMs: number,
  interpolate: (value: string) => string,
): Promise<RestRequestOutcome> {
  try {
    const headers = new Headers({
      'user-agent': 'Yasumu MCP/1.0',
      origin: 'http://localhost',
    });

    for (const header of entity.requestHeaders ?? []) {
      if (header.enabled && header.key) {
        headers.append(interpolate(header.key), interpolate(header.value));
      }
    }

    const url = buildUrl(entity, pathParams, queryParams, interpolate);
    const body = buildRequestBody(entity.requestBody, headers, interpolate);
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);
    const start = performance.now();

    try {
      const response = await fetch(url, {
        method: entity.method,
        headers,
        body,
        signal: abortController.signal,
      });
      const elapsed = performance.now() - start;
      const responseHeaders = Object.fromEntries(response.headers.entries());
      const contentType = response.headers.get('content-type') ?? '';
      const contentLength = response.headers.get('content-length');
      const declaredSize = contentLength
        ? Number.parseInt(contentLength, 10)
        : 0;
      const isText = isTextContentType(contentType);
      const maxSize = isText ? MAX_TEXT_BODY_SIZE : MAX_BINARY_BODY_SIZE;
      let textBody: string | null = null;
      let bodyTruncated = false;
      let actualSize = Number.isFinite(declaredSize) ? declaredSize : 0;

      if (actualSize > maxSize) {
        bodyTruncated = true;
      } else if (isText) {
        const text = await response.text();
        actualSize = new Blob([text]).size;
        if (actualSize > MAX_TEXT_BODY_SIZE) {
          bodyTruncated = true;
        } else {
          textBody = text;
        }
      } else {
        const buffer = await response.arrayBuffer();
        actualSize = buffer.byteLength;
        bodyTruncated = actualSize > MAX_BINARY_BODY_SIZE;
      }

      return {
        response: {
          status: response.status,
          statusText: response.statusText,
          time: elapsed,
          headers: responseHeaders,
          cookies: extractCookies(response.headers),
          textBody,
          bodyType: isText ? 'text' : 'binary',
          size: actualSize,
          bodyTruncated,
        },
        error: null,
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return {
      response: null,
      error:
        error instanceof Error && error.name === 'AbortError'
          ? 'Request timed out'
          : error instanceof Error
            ? error.message
            : String(error),
    };
  }
}

function createMockResponse(value: unknown): RestExecutionResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const status = typeof value.status === 'number' ? value.status : 200;
  const statusText =
    typeof value.statusText === 'string' ? value.statusText : 'OK';
  const headers = isRecord(value.headers)
    ? Object.fromEntries(
        Object.entries(value.headers).map(([key, entry]) => [
          key,
          String(entry),
        ]),
      )
    : {};
  const body =
    typeof value.body === 'string'
      ? value.body
      : value.body === null || value.body === undefined
        ? ''
        : JSON.stringify(value.body);

  return {
    status,
    statusText,
    headers,
    cookies: [],
    textBody: body,
    bodyType: 'text',
    time: 0,
    size: new Blob([body]).size,
    bodyTruncated: false,
  };
}

function createResponseContext(
  context: RestScriptContext,
  response: RestExecutionResponse,
): RestScriptContext {
  return {
    ...context,
    response: {
      status: response.status,
      headers: response.headers,
      body:
        !response.bodyTruncated && response.bodyType === 'text'
          ? (response.textBody ?? '')
          : null,
    },
  };
}

function getTestResults(
  result: ScriptExecutionResult<RestScriptContext> | null,
) {
  const output = result?.result.success ? result.result.result : null;
  if (!isRecord(output) || !Array.isArray(output.testResults)) {
    return [];
  }
  return output.testResults as TestResult[];
}

async function executeRestTool(
  execute: RpcExecute,
  rpcServer: DenApplication,
  input: ToolInput,
) {
  const workspaceId = await resolveWorkspaceId(rpcServer, input);
  const id = requireString(input, 'id');
  const timeoutMs = optionalNumber(input, 'timeoutMs') ?? 30_000;
  const pathParams = normalizePathParams(input.pathParams);
  const entity = (await execute(
    'rest.get',
    [id],
    workspaceId,
  )) as RestEntityData | null;

  if (!entity) {
    throw new Error(`REST request "${id}" was not found.`);
  }
  const workspace = (await findWorkspaceByReference(
    rpcServer,
    workspaceId,
  )) ?? {
    id: workspaceId,
    name: workspaceId,
    path: workspaceId,
  };
  const environment = (await execute(
    'environments.getActive',
    [],
    workspaceId,
  ).catch(() => null)) as EnvironmentData | null;
  const values = buildInterpolationMap(environment, input.variables);
  const interpolate = createInterpolator(values);
  const script = buildScript(input, entity);
  const scriptChanged = script !== entity.script;

  if (scriptChanged && optionalBoolean(input, 'persistScript') === true) {
    await execute('rest.update', [id, { script }], workspaceId, 'mutation');
  }

  let currentContext: RestScriptContext = {
    environment,
    request: {
      url: interpolate(entity.url ?? ''),
      method: entity.method,
      headers: buildRequestHeaders(entity.requestHeaders, interpolate),
      body:
        typeof entity.requestBody?.value === 'string'
          ? interpolate(entity.requestBody.value)
          : (entity.requestBody?.value ?? null),
      parameters: buildPathParameterValues(pathParams, interpolate),
    },
    response: null,
    workspace: getWorkspaceContext(workspace),
  };

  let preRequest: ScriptExecutionResult<RestScriptContext> | null = null;
  let response: RestExecutionResponse | null = null;
  let mocked = false;

  if (script.code.trim()) {
    preRequest = await executeRestScript(
      execute,
      workspaceId,
      id,
      script,
      'onRequest',
      currentContext,
    );

    if (preRequest.result.success) {
      currentContext = preRequest.context;
      response = createMockResponse(preRequest.result.result);
      mocked = !!response;
    }
  }

  if (!response) {
    const modifiedEntity: RestEntityData = {
      ...entity,
      url: currentContext.request.url,
      method: currentContext.request.method,
      requestHeaders: Object.entries(currentContext.request.headers).map(
        ([key, value]) => ({ key, value, enabled: true }),
      ),
      requestBody:
        currentContext.request.body !== null &&
        currentContext.request.body !== undefined
          ? {
              ...(entity.requestBody ?? {
                type: 'text' as const,
                metadata: {},
              }),
              value: currentContext.request.body,
            }
          : entity.requestBody,
    };

    const outcome = await executeHttpRequest(
      modifiedEntity,
      pathParams,
      input.queryParams,
      timeoutMs,
      interpolate,
    );

    if (outcome.error) {
      return {
        request: {
          id,
          name: entity.name,
          method: currentContext.request.method,
          url: currentContext.request.url,
        },
        response: null,
        error: outcome.error,
        lifecycle: {
          preRequest: summarizeScriptResult(preRequest),
          postResponse: null,
          tests: null,
          mocked,
        },
      };
    }

    response = outcome.response;
  }

  let postResponse: ScriptExecutionResult<RestScriptContext> | null = null;
  let testResult: ScriptExecutionResult<RestScriptContext> | null = null;

  if (script.code.trim()) {
    const responseContext = createResponseContext(currentContext, response);
    postResponse = await executeRestScript(
      execute,
      workspaceId,
      id,
      script,
      'onResponse',
      responseContext,
    );

    if (postResponse.result.success && postResponse.context.environment) {
      await execute(
        'environments.update',
        [
          postResponse.context.environment.id,
          {
            variables: postResponse.context.environment.variables,
            secrets: postResponse.context.environment.secrets,
          },
        ],
        workspaceId,
        'mutation',
      ).catch(() => null);
    }

    testResult = await executeRestScript(
      execute,
      workspaceId,
      id,
      script,
      'onTest',
      responseContext,
    );
  }

  return {
    request: {
      id,
      name: entity.name,
      method: currentContext.request.method,
      url: currentContext.request.url,
    },
    response,
    error: null,
    lifecycle: {
      preRequest: summarizeScriptResult(preRequest),
      postResponse: summarizeScriptResult(postResponse),
      tests: {
        summary: summarizeScriptResult(testResult),
        results: getTestResults(testResult),
      },
      mocked,
    },
  };
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
  ) =>
    execute(action, payload, await resolveWorkspaceId(rpcServer, input), type);

  const objectSchema = (
    properties: Record<string, unknown>,
    required: string[] = [],
  ): JsonSchemaObject => ({
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  });

  const workspaceReferenceProperty = {
    type: 'string',
    description: 'Workspace id, name, path, or path folder name.',
  };

  return [
    {
      name: 'workspaces_list',
      description: 'List recent Yasumu workspaces.',
      inputSchema: objectSchema({ take: { type: 'number' } }),
      call: (input) =>
        execute('workspaces.list', [
          { take: typeof input.take === 'number' ? input.take : 20 },
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
        { workspaceId: workspaceReferenceProperty, id: { type: 'string' } },
        ['id'],
      ),
      call: (input) =>
        workspaceAware(input, 'rest.get', [requireString(input, 'id')]),
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
      call: (input) =>
        workspaceAware(
          input,
          'rest.update',
          [requireString(input, 'id'), input.data ?? {}],
          'mutation',
        ),
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
        'Execute a saved REST request by id. Runs onRequest, sends or mocks the HTTP request, runs onResponse, then runs onTest.',
      inputSchema: objectSchema(
        {
          workspaceId: workspaceReferenceProperty,
          id: { type: 'string' },
          pathParams: {
            type: 'object',
            description:
              'Path parameters by name. Values can be strings or { value, enabled } objects.',
          },
          queryParams: {
            type: 'object',
            description: 'Extra query parameters appended for this execution.',
          },
          variables: {
            type: 'object',
            description:
              'Temporary interpolation variables for this execution. They override the active environment.',
          },
          timeoutMs: {
            type: 'number',
            description: 'HTTP timeout in milliseconds. Defaults to 30000.',
          },
          script: {
            type: 'string',
            description:
              'Optional JavaScript lifecycle script to use for this run.',
          },
          persistScript: {
            type: 'boolean',
            description:
              'When script is provided, persist it on the saved request before execution.',
          },
        },
        ['id'],
      ),
      call: (input) => executeRestTool(execute, rpcServer, input),
    },
    {
      name: 'rest_delete',
      description: 'Delete a REST request by id.',
      inputSchema: objectSchema(
        { workspaceId: workspaceReferenceProperty, id: { type: 'string' } },
        ['id'],
      ),
      call: (input) =>
        workspaceAware(
          input,
          'rest.delete',
          [requireString(input, 'id')],
          'mutation',
        ),
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
        { workspaceId: workspaceReferenceProperty, id: { type: 'string' } },
        ['id'],
      ),
      call: (input) =>
        workspaceAware(input, 'graphql.get', [requireString(input, 'id')]),
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
        workspaceAware(
          input,
          'graphql.update',
          [requireString(input, 'id'), input.data ?? {}],
          'mutation',
        ),
    },
    {
      name: 'graphql_delete',
      description: 'Delete a GraphQL request by id.',
      inputSchema: objectSchema(
        { workspaceId: workspaceReferenceProperty, id: { type: 'string' } },
        ['id'],
      ),
      call: (input) =>
        workspaceAware(
          input,
          'graphql.delete',
          [requireString(input, 'id')],
          'mutation',
        ),
    },
    {
      name: 'synchronization_synchronize',
      description: 'Synchronize the active or provided workspace with disk.',
      inputSchema: objectSchema({ workspaceId: workspaceReferenceProperty }),
      call: async (input) =>
        execute(
          'synchronization.synchronize',
          [],
          await resolveWorkspaceId(rpcServer, input),
          'mutation',
        ),
    },
  ];
}

export function createMcpServer(rpcServer: DenApplication) {
  const tools = createTools(rpcServer);
  const toolMap = new Map(tools.map((tool) => [tool.name, tool]));

  const processRequest = async (
    request: JsonRpcRequest,
  ): Promise<JsonRpcResponse | null> => {
    if (!request.method) {
      return isNotification(request)
        ? null
        : jsonRpcError(request.id, -32600, 'Invalid request');
    }

    if (isNotification(request)) {
      return null;
    }

    if (request.method === 'initialize') {
      const requestedProtocol =
        typeof request.params?.protocolVersion === 'string'
          ? request.params.protocolVersion
          : '2025-03-26';

      return jsonRpcResult(request.id, {
        protocolVersion: requestedProtocol,
        serverInfo: { name: 'yasumu', version: Yasumu.version },
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
      if (!tool)
        return jsonRpcError(request.id, -32602, `Unknown tool: ${name}`);

      let result: unknown;
      try {
        result = await tool.call(
          input && typeof input === 'object' ? (input as ToolInput) : {},
        );
      } catch (error) {
        return jsonRpcError(
          request.id,
          -32602,
          error instanceof Error ? error.message : String(error),
        );
      }

      return jsonRpcResult(request.id, textResult(result));
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
        const payload = (await c.req.json()) as
          | JsonRpcRequest
          | JsonRpcRequest[];

        if (Array.isArray(payload)) {
          const responses = (
            await Promise.all(payload.map((request) => processRequest(request)))
          ).filter((response): response is JsonRpcResponse => !!response);

          if (responses.length === 0) {
            return c.body(null, 202);
          }

          return c.json(responses);
        }

        const response = await processRequest(payload);
        if (!response) {
          return c.body(null, 202);
        }

        const status =
          'error' in response && response.error.code === -32601 ? 404 : 200;
        return c.json(response, status);
      } catch (error) {
        return c.json(
          jsonRpcError(
            null,
            -32000,
            error instanceof Error ? error.message : String(error),
          ),
          500,
        );
      }
    });
}
