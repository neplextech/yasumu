import assert from 'node:assert/strict';

import type { DenApplication, RpcRequest } from '@yasumu/den';

declare global {
  var Yasumu: {
    readonly isDevMode: boolean;
    readonly version: string;
    cuid(): string;
    getAppDataDir(): string;
  };
}

const appDataDirectory = Deno.makeTempDirSync({ prefix: 'yasumu-mcp-test-' });
Object.defineProperty(globalThis, 'Yasumu', {
  configurable: true,
  value: {
    isDevMode: false,
    version: 'test',
    cuid: () => crypto.randomUUID(),
    getAppDataDir: () => appDataDirectory,
  },
  writable: true,
});

const { createMcpServer } = await import('./server.ts');

interface RecordedRpcCall {
  request: RpcRequest;
  context: Record<string, unknown> | undefined;
}

type RpcHandler = (request: RpcRequest, context: Record<string, unknown> | undefined) => unknown | Promise<unknown>;

class FakeRpcServer implements DenApplication {
  readonly calls: RecordedRpcCall[] = [];

  constructor(private readonly handler: RpcHandler) {}

  async execute(request: RpcRequest, context?: Record<string, unknown>) {
    this.calls.push({ request, context });
    return await this.handler(request, context);
  }

  close() {
    return Promise.resolve();
  }
}

interface McpApplication {
  request(input: RequestInfo | URL, requestInit?: RequestInit): Response | Promise<Response>;
}

interface ToolCallResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

function workspaceResult(reference = 'workspace') {
  return {
    id: reference,
    name: 'Workspace',
    path: '/workspaces/example',
  };
}

async function postJson(app: McpApplication, payload: unknown) {
  return await app.request('http://localhost/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function callTool(
  app: McpApplication,
  name: string,
  arguments_: Record<string, unknown>,
  id: string | number = 1,
) {
  const response = await postJson(app, {
    jsonrpc: '2.0',
    id,
    method: 'tools/call',
    params: { name, arguments: arguments_ },
  });
  assert.equal(response.status, 200);
  const envelope = (await response.json()) as {
    result: ToolCallResult;
  };
  return envelope.result;
}

function parseToolText(result: ToolCallResult) {
  assert.equal(result.content.length, 1);
  assert.equal(result.content[0]?.type, 'text');
  return JSON.parse(result.content[0]!.text) as unknown;
}

function executionResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    executionId: 'execution',
    rootExecutionId: 'execution',
    entityId: 'entity',
    entityKind: 'rest',
    request: {
      url: 'https://example.test/pets/blue',
      method: 'GET',
      headers: {},
      body: null,
    },
    response: {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      body: '{"ok":true}',
    },
    isMockResponse: true,
    status: 'completed',
    startedAt: 10,
    completedAt: 15,
    durationMs: 5,
    tests: [
      {
        id: 'test-1',
        name: 'returns a pet',
        status: 'passed',
        durationMs: 1,
      },
    ],
    logs: [{ level: 'info', message: 'mocked', timestamp: 12 }],
    diagnostics: [],
    nestedExecutions: [],
    events: [],
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

Deno.test('MCP preserves CRUD tools and adds GraphQL and SSE execution parity', async () => {
  const rpcServer = new FakeRpcServer(() => null);
  const app = createMcpServer(rpcServer);
  const response = await postJson(app, {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
  });
  const envelope = (await response.json()) as {
    result: { tools: Array<{ name: string }> };
  };
  const names = envelope.result.tools.map((tool) => tool.name);

  assert.deepEqual(names, [
    'workspaces_list',
    'workspaces_active',
    'workspaces_get',
    'rest_list',
    'rest_get',
    'rest_create',
    'rest_update',
    'rest_update_script',
    'rest_execute',
    'rest_delete',
    'graphql_list',
    'graphql_get',
    'graphql_create',
    'graphql_update',
    'graphql_execute',
    'graphql_delete',
    'sse_list',
    'sse_get',
    'sse_create',
    'sse_update',
    'sse_execute',
    'sse_delete',
    'synchronization_synchronize',
  ]);
});

Deno.test('REST MCP execution forwards the canonical command and returns its exact mock and test result', async () => {
  const expected = executionResult({
    executionId: 'rest-execution',
    entityId: 'rest-1',
  });
  const rpcServer = new FakeRpcServer((request) => {
    if (request.action === 'workspaces.get') return workspaceResult();
    if (request.action === 'execution.execute') return expected;
    throw new Error(`Unexpected RPC action: ${request.action}`);
  });
  const app = createMcpServer(rpcServer);
  const result = await callTool(app, 'rest_execute', {
    workspaceId: 'workspace',
    id: 'rest-1',
    executionId: 'rest-execution',
    mode: 'test',
    environmentId: 'environment',
    pathParams: {
      pet: { value: 'blue', enabled: true },
      ignored: { value: 'red', enabled: false },
    },
    variables: { page: 2, nested: { enabled: true } },
    secrets: { token: 'secret' },
    timeoutMs: 4_000,
    scriptTimeoutMs: 500,
    includeResponseBody: true,
    followRedirects: false,
  });

  assert.deepEqual(parseToolText(result), expected);
  const executionCall = rpcServer.calls.find(({ request }) => request.action === 'execution.execute');
  assert.deepEqual(executionCall, {
    request: {
      type: 'mutation',
      action: 'execution.execute',
      payload: [
        {
          entityId: 'rest-1',
          executionId: 'rest-execution',
          mode: 'test',
          environmentId: 'environment',
          variables: { page: 2, nested: { enabled: true } },
          secrets: { token: 'secret' },
          pathParameters: { pet: 'blue' },
          options: {
            timeoutMs: 4_000,
            scriptTimeoutMs: 500,
            includeResponseBody: true,
            followRedirects: false,
          },
        },
      ],
    },
    context: { workspaceId: 'workspace' },
  });
});

Deno.test('GraphQL MCP execution uses the same command and preserves structured failures', async () => {
  const expected = executionResult({
    executionId: 'graphql-execution',
    entityId: 'graphql-1',
    entityKind: 'graphql',
    request: {
      url: 'https://example.test/graphql',
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"query":"query Viewer { viewer { id } }"}',
    },
    response: undefined,
    isMockResponse: false,
    status: 'failed',
    tests: [],
    error: {
      code: 'TRANSPORT_ERROR',
      message: 'Connection refused',
      details: { retryable: true },
    },
  });
  const rpcServer = new FakeRpcServer((request) => {
    if (request.action === 'workspaces.get') return workspaceResult();
    if (request.action === 'execution.execute') return expected;
    throw new Error(`Unexpected RPC action: ${request.action}`);
  });
  const app = createMcpServer(rpcServer);
  const result = await callTool(app, 'graphql_execute', {
    workspaceId: 'workspace',
    id: 'graphql-1',
    executionId: 'graphql-execution',
    variables: { userId: 42 },
  });

  assert.deepEqual(parseToolText(result), JSON.parse(JSON.stringify(expected)));
  const executionCall = rpcServer.calls.find(({ request }) => request.action === 'execution.execute');
  assert.deepEqual(executionCall?.request.payload, [
    {
      entityId: 'graphql-1',
      executionId: 'graphql-execution',
      mode: 'run',
      variables: { userId: 42 },
    },
  ]);
});

Deno.test('SSE MCP execution forwards stream limits and returns collected events', async () => {
  const expected = executionResult({
    executionId: 'sse-execution',
    entityId: 'sse-1',
    entityKind: 'sse',
    events: [{ id: '1', event: 'update', data: '{"ok":true}', receivedAt: 10 }],
  });
  const rpcServer = new FakeRpcServer((request) => {
    if (request.action === 'workspaces.get') return workspaceResult();
    if (request.action === 'execution.execute') return expected;
    throw new Error(`Unexpected RPC action: ${request.action}`);
  });
  const result = await callTool(createMcpServer(rpcServer), 'sse_execute', {
    workspaceId: 'workspace',
    id: 'sse-1',
    executionId: 'sse-execution',
    maxEvents: 3,
  });

  assert.deepEqual(parseToolText(result), expected);
  const executionCall = rpcServer.calls.find(({ request }) => request.action === 'execution.execute');
  assert.deepEqual(executionCall?.request.payload, [
    {
      entityId: 'sse-1',
      executionId: 'sse-execution',
      mode: 'run',
      options: { maxEvents: 3 },
    },
  ]);
});

Deno.test('MCP reports unsupported legacy overrides as structured tool errors', async () => {
  const rpcServer = new FakeRpcServer((request) => {
    if (request.action === 'workspaces.get') return workspaceResult();
    throw new Error(`Unexpected RPC action: ${request.action}`);
  });
  const app = createMcpServer(rpcServer);
  const result = await callTool(app, 'rest_execute', {
    workspaceId: 'workspace',
    id: 'rest-1',
    queryParams: { page: 2 },
  });

  assert.equal(result.isError, true);
  assert.deepEqual(parseToolText(result), {
    error: {
      code: 'MCP_INVALID_TOOL_INPUT',
      message:
        'Per-execution queryParams overrides are not supported by the canonical execution contract. Update the saved request query parameters before executing it.',
      details: { field: 'queryParams' },
    },
  });
  assert.equal(
    rpcServer.calls.some(({ request }) => request.action === 'execution.execute'),
    false,
  );
});

Deno.test('MCP cancellation notifications forward to execution.cancel and return the cancelled result', async () => {
  const started = deferred<void>();
  const completed = deferred<Record<string, unknown>>();
  const cancelled = executionResult({
    executionId: 'cancel-execution',
    entityId: 'rest-1',
    response: undefined,
    isMockResponse: false,
    status: 'cancelled',
    tests: [],
    error: {
      code: 'EXECUTION_CANCELLED',
      message: 'stop now',
    },
  });
  const rpcServer = new FakeRpcServer((request) => {
    if (request.action === 'workspaces.get') return workspaceResult();
    if (request.action === 'execution.execute') {
      started.resolve();
      return completed.promise;
    }
    if (request.action === 'execution.cancel') {
      completed.resolve(cancelled);
      return true;
    }
    throw new Error(`Unexpected RPC action: ${request.action}`);
  });
  const app = createMcpServer(rpcServer);
  const executionResponse = callTool(
    app,
    'rest_execute',
    {
      workspaceId: 'workspace',
      id: 'rest-1',
      executionId: 'cancel-execution',
      mode: 'run',
    },
    91,
  );
  await started.promise;

  const notificationResponse = await postJson(app, {
    jsonrpc: '2.0',
    method: 'notifications/cancelled',
    params: { requestId: 91, reason: 'stop now' },
  });
  assert.equal(notificationResponse.status, 202);
  assert.deepEqual(parseToolText(await executionResponse), JSON.parse(JSON.stringify(cancelled)));

  const cancelCall = rpcServer.calls.find(({ request }) => request.action === 'execution.cancel');
  assert.deepEqual(cancelCall, {
    request: {
      type: 'mutation',
      action: 'execution.cancel',
      payload: ['cancel-execution', 'stop now'],
    },
    context: { workspaceId: 'workspace' },
  });
});
