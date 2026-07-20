import type {
  CreateRuntimeSessionInput,
  InvokeHookOptions,
  RuntimeCapabilities,
  ScriptHookInvocation,
  ScriptHookResult,
  YasumuScriptRuntime,
} from '@yasumu/runtime-api';
import { requestFromSnapshot, snapshotRequest, snapshotResponse } from '@yasumu/runtime-api';
import { describe, expect, it } from 'vitest';

import {
  HeadlessExecutionService,
  InMemoryCookieRepository,
  InMemoryEntityRepository,
  InMemoryWorkspaceRepository,
  type ExecutionRecord,
  type RequestTransport,
  type RequestTransportContext,
  parseSse,
  WorkspaceCookieJar,
  YasumuErrorCodes,
} from '../src/index.js';
import { environment, graphqlEntity, group, restEntity, script, sseEntity, workspace } from './fixtures.js';

const capabilities: RuntimeCapabilities = {
  workers: true,
  nodeBuiltins: false,
  filesystemRead: false,
  filesystemWrite: false,
  network: false,
  environment: false,
  subprocess: false,
  ffi: false,
  nativeModules: false,
  virtualModules: true,
  workspaceFiles: true,
  email: true,
  nestedExecution: true,
};

class BehaviorRuntime implements YasumuScriptRuntime {
  readonly kind = 'test';
  readonly capabilities = capabilities;
  readonly order: string[] = [];
  sessions = 0;

  async createSession(input: CreateRuntimeSessionInput) {
    this.sessions += 1;
    return {
      invokeHook: (invocation: ScriptHookInvocation, options?: InvokeHookOptions) =>
        this.invoke(input, invocation, options),
      dispose: async () => undefined,
    };
  }

  private async invoke(
    session: CreateRuntimeSessionInput,
    invocation: ScriptHookInvocation,
    options?: InvokeHookOptions,
  ): Promise<ScriptHookResult> {
    this.order.push(`${invocation.hook}:${invocation.source.id}`);
    const code = invocation.source.code;
    const signal = options?.signal ?? new AbortController().signal;
    let request = invocation.request;
    let mockResponse;

    if (code.includes('wait')) await waitForAbort(signal);
    if (code.includes('throw')) throw new Error('runtime exploded');
    if (code.includes('assert-full-bodies')) {
      const body = invocation.hook === 'onRequest' ? invocation.request?.body : invocation.response?.body;
      if (!body || body.size !== 10 || body.truncated) {
        throw new Error(`${invocation.hook} received a truncated internal body`);
      }
    }
    if (code.includes('mutate') && invocation.hook === 'onRequest' && invocation.request) {
      const current = requestFromSnapshot(invocation.request);
      const headers = new Headers(current.headers);
      headers.set('x-mutated', invocation.source.id);
      request = await snapshotRequest(new Request(current, { headers }));
    }
    if (code.includes('mock') && invocation.hook === 'onRequest') {
      mockResponse = await snapshotResponse(
        new Response(JSON.stringify({ mocked: true }), {
          status: 209,
          headers: {
            'content-type': 'application/json',
            ...(code.includes('mock-cookie') ? { 'set-cookie': 'mocked=true; Path=/; HttpOnly' } : {}),
          },
        }),
      );
    }
    if (code.includes('nested:') && invocation.hook === 'onResponse') {
      const [, kind, id] = code.match(/nested:(rest|graphql|sse):([A-Za-z0-9_-]+)/) ?? [];
      await session.hostCall(
        'entity.execute',
        { kind: kind as 'rest' | 'graphql' | 'sse', id: id!, options: { withResponse: true, maxEvents: 1 } },
        signal,
      );
    }

    const secret = invocation.environment.secrets.TOKEN;
    const environment = code.includes('set-new-secret')
      ? {
          ...invocation.environment,
          secrets: { ...invocation.environment.secrets, SCRIPT_TOKEN: 'runtime-secret' },
        }
      : code.includes('rotate-secret')
        ? {
            ...invocation.environment,
            secrets: { ...invocation.environment.secrets, TOKEN: 'replacement-secret' },
          }
        : invocation.environment;
    return {
      request,
      mockResponse,
      environment,
      tests:
        invocation.hook === 'onTest' ? [{ test: invocation.source.id, result: 'pass', error: null, duration: 1 }] : [],
      logs: code.includes('set-new-secret')
        ? [{ level: 'info', message: 'script token=runtime-secret', timestamp: 1 }]
        : code.includes('rotate-secret')
          ? [{ level: 'info', message: `old=${secret}; new=replacement-secret`, timestamp: 1 }]
          : code.includes('log-secret')
            ? [{ level: 'info', message: `token=${secret}`, timestamp: 1 }]
            : code.includes('child-log')
              ? [{ level: 'info', message: 'child log', timestamp: 1 }]
              : [],
      diagnostics: [],
      cancelled: code.includes('cancel'),
      cancelReason: code.includes('cancel') ? 'script cancellation' : undefined,
    };
  }
}

class RecordingTransport implements RequestTransport {
  readonly requests: Request[] = [];

  constructor(
    private readonly response = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  ) {}

  async send(request: Request, _context: RequestTransportContext, _signal: AbortSignal): Promise<Response> {
    this.requests.push(request.clone());
    return this.response.clone();
  }
}

function serviceFor(
  runtime: YasumuScriptRuntime,
  transport: RequestTransport,
  fixture = workspace(),
  additions: Partial<ConstructorParameters<typeof HeadlessExecutionService>[0]> = {},
) {
  const workspaces = new InMemoryWorkspaceRepository([fixture]);
  return new HeadlessExecutionService({
    workspaces,
    entities: new InMemoryEntityRepository(workspaces),
    runtime,
    transport,
    ...additions,
  });
}

describe('HeadlessExecutionService', () => {
  it('does not create a script runtime for a scriptless run', async () => {
    const runtime = new BehaviorRuntime();
    const result = await serviceFor(runtime, new RecordingTransport()).execute({
      workspaceId: 'workspace-1',
      entityId: 'rest-1',
    });

    expect(result.status).toBe('completed');
    expect(runtime.sessions).toBe(0);
  });

  it('cascades workspace, group, entity, response, and test hooks deterministically', async () => {
    const runtime = new BehaviorRuntime();
    const transport = new RecordingTransport();
    const parent = group({ id: 'parent', script: script('parent') });
    const child = group({ id: 'child', parentId: 'parent', script: script('child') });
    const entity = restEntity({
      groupId: 'child',
      scripts: { lifecycle: script('entity-life', 'mutate'), test: script('entity-test') },
    });
    const fixture = workspace({ script: script('workspace'), groups: [parent, child], entities: [entity] });
    const result = await serviceFor(runtime, transport, fixture).execute({
      workspaceId: fixture.id,
      entityId: entity.id,
      mode: 'test',
    });

    expect(result.status).toBe('completed');
    expect(runtime.order).toEqual([
      'onRequest:workspace',
      'onRequest:parent',
      'onRequest:child',
      'onRequest:entity-life',
      'onResponse:workspace',
      'onResponse:parent',
      'onResponse:child',
      'onResponse:entity-life',
      'onTest:workspace',
      'onTest:parent',
      'onTest:child',
      'onTest:entity-life',
      'onTest:entity-test',
    ]);
    expect(transport.requests[0]?.headers.get('x-mutated')).toBe('entity-life');
    expect(result.tests.map((test) => test.test)).toEqual([
      'workspace',
      'parent',
      'child',
      'entity-life',
      'entity-test',
    ]);
  });

  it('uses mocked responses without transport and still runs response/test hooks', async () => {
    const runtime = new BehaviorRuntime();
    const transport = new RecordingTransport();
    const entity = restEntity({ scripts: { lifecycle: script('mocking', 'mock') } });
    const fixture = workspace({ entities: [entity] });
    const result = await serviceFor(runtime, transport, fixture).execute({
      workspaceId: fixture.id,
      entityId: entity.id,
      mode: 'test',
    });

    expect(result).toMatchObject({ status: 'completed', isMockResponse: true, response: { status: 209 } });
    expect(transport.requests).toHaveLength(0);
    expect(runtime.order).toEqual(['onRequest:mocking', 'onResponse:mocking', 'onTest:mocking']);
  });

  it('stores cookies returned by a script mock response', async () => {
    const cookies = new WorkspaceCookieJar(new InMemoryCookieRepository(), { generateId: () => 'mock-cookie' });
    const entity = restEntity({ scripts: { lifecycle: script('mock-cookie', 'mock-cookie') } });
    const result = await serviceFor(
      new BehaviorRuntime(),
      new RecordingTransport(),
      workspace({ entities: [entity] }),
      { cookies },
    ).execute({ workspaceId: 'workspace-1', entityId: entity.id });

    expect(result).toMatchObject({ status: 'completed', isMockResponse: true });
    expect(await cookies.list('workspace-1')).toMatchObject([{ name: 'mocked', value: 'true', httpOnly: true }]);
  });

  it('applies body limits only to serialized output, not hooks or transport', async () => {
    const runtime = new BehaviorRuntime();
    const transport = new RecordingTransport(new Response('abcdefghij', { headers: { 'content-type': 'text/plain' } }));
    const entity = restEntity({
      method: 'POST',
      body: { type: 'text', value: '0123456789' },
      scripts: { lifecycle: script('body-inspector', 'assert-full-bodies') },
    });
    const result = await serviceFor(runtime, transport, workspace({ entities: [entity] })).execute({
      workspaceId: 'workspace-1',
      entityId: entity.id,
      options: { maxRequestBodyBytes: 4, maxResponseBodyBytes: 4 },
    });

    expect(result.status).toBe('completed');
    expect(await transport.requests[0]!.text()).toBe('0123456789');
    expect(result.request?.body).toMatchObject({ kind: 'text', text: '0123', size: 10, truncated: true });
    expect(result.response?.body).toMatchObject({ kind: 'text', text: 'abcd', size: 10, truncated: true });
  });

  it('executes nested GraphQL requests with lineage and collected child output', async () => {
    const runtime = new BehaviorRuntime();
    const transport = new RecordingTransport();
    const parent = restEntity({ id: 'parent', scripts: { lifecycle: script('parent-life', 'nested:graphql:child') } });
    const child = graphqlEntity({ id: 'child', scripts: { lifecycle: script('child-life', 'child-log') } });
    const fixture = workspace({ entities: [parent, child] });
    let nextId = 0;
    const result = await serviceFor(runtime, transport, fixture, {
      ids: { generate: () => `generated-${++nextId}` },
    }).execute({ workspaceId: fixture.id, entityId: parent.id, executionId: 'root' });

    expect(result.status).toBe('completed');
    expect(result.nestedExecutions).toEqual([
      expect.objectContaining({
        executionId: 'generated-1',
        entityId: 'child',
        status: 'completed',
        response: expect.objectContaining({ status: 200 }),
        logs: [expect.objectContaining({ message: 'child log' }), expect.objectContaining({ message: 'child log' })],
      }),
    ]);
    expect(transport.requests).toHaveLength(2);
  });

  it('parses multiline SSE fields and retains the last event ID', async () => {
    const body = [
      '\uFEFF: heartbeat',
      'id: first',
      'event: update',
      'retry: 25',
      'data: line one',
      'data: line two',
      '',
      'data: next',
      '',
    ].join('\n');
    const events = [];
    for await (const event of parseSse(new Response(body).body!)) events.push(event);

    expect(events).toMatchObject([
      { id: 'first', event: 'update', data: 'line one\nline two', retry: 25 },
      { id: 'first', event: 'message', data: 'next' },
    ]);
  });

  it('streams SSE events, filters event types, reconnects with server retry, and sends Last-Event-ID', async () => {
    const requests: Request[] = [];
    const responses = [
      'retry: 1\n\nid: 1\nevent: ignored\ndata: skip\n\nid: 2\nevent: update\ndata: first\n\n',
      'event: update\ndata: second\n\n',
    ];
    const transport: RequestTransport = {
      async send(request) {
        requests.push(request.clone());
        return new Response(responses.shift(), { headers: { 'content-type': 'text/event-stream' } });
      },
    };
    const emitted: unknown[] = [];
    const entity = sseEntity({
      eventTypes: ['{{variables.eventType}}'],
      reconnect: { enabled: true, retryMs: 5000 },
    });
    const result = await serviceFor(new BehaviorRuntime(), transport, workspace({ entities: [entity] }), {
      events: { emit: (event) => void emitted.push(event) },
    }).execute({
      workspaceId: 'workspace-1',
      entityId: entity.id,
      variables: { eventType: 'update' },
      options: { maxEvents: 2 },
    });

    expect(result.status).toBe('completed');
    expect(result.events).toMatchObject([
      { id: '2', event: 'update', data: 'first' },
      { id: '2', event: 'update', data: 'second' },
    ]);
    expect(requests).toHaveLength(2);
    expect(requests[1]?.headers.get('last-event-id')).toBe('2');
    expect(emitted).toContainEqual(expect.objectContaining({ type: 'sse-event-received', event: result.events[0] }));
    expect(result.response?.body).toMatchObject({
      kind: 'json',
      value: { events: result.events.map(({ retry: _retry, ...event }) => event) },
    });
  });

  it('allows scripts on any entity kind to invoke SSE and SSE response scripts to invoke REST', async () => {
    const runtime = new BehaviorRuntime();
    const transport: RequestTransport = {
      async send(request) {
        return request.headers.get('accept') === 'text/event-stream'
          ? new Response('id: 1\ndata: streamed\n\n', { headers: { 'content-type': 'text/event-stream' } })
          : new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } });
      },
    };
    const restParent = restEntity({
      id: 'rest-parent',
      scripts: { lifecycle: script('rest-parent', 'nested:sse:stream') },
    });
    const stream = sseEntity({
      id: 'stream',
      reconnect: { enabled: false, retryMs: 1 },
      scripts: { lifecycle: script('stream-life', 'nested:rest:rest-child') },
    });
    const restChild = restEntity({ id: 'rest-child' });
    const fixture = workspace({ entities: [restParent, stream, restChild] });

    const fromRest = await serviceFor(runtime, transport, fixture).execute({
      workspaceId: fixture.id,
      entityId: restParent.id,
    });
    expect(fromRest.nestedExecutions[0]).toMatchObject({ entityId: 'stream', status: 'completed' });

    const fromSse = await serviceFor(runtime, transport, fixture).execute({
      workspaceId: fixture.id,
      entityId: stream.id,
      options: { maxEvents: 1 },
    });
    expect(fromSse.events).toHaveLength(1);
    expect(fromSse.nestedExecutions[0]).toMatchObject({ entityId: 'rest-child', status: 'completed' });
  });

  it('treats a REST text/event-stream response as a live event response without changing entity kind', async () => {
    const emitted: unknown[] = [];
    const entity = restEntity();
    const transport = new RecordingTransport(
      new Response('id: 1\nevent: update\ndata: first\n\ndata: second\n\n', {
        headers: { 'content-type': 'text/event-stream', 'x-stream': 'rest' },
      }),
    );
    const result = await serviceFor(new BehaviorRuntime(), transport, workspace({ entities: [entity] }), {
      events: { emit: (event) => void emitted.push(event) },
    }).execute({ workspaceId: 'workspace-1', entityId: entity.id });

    expect(result).toMatchObject({ status: 'completed', entityKind: 'rest' });
    expect(result.events).toMatchObject([
      { id: '1', event: 'update', data: 'first' },
      { id: '1', event: 'message', data: 'second' },
    ]);
    expect(result.response?.headers).toContainEqual(['x-yasumu-original-content-type', 'text/event-stream']);
    expect(emitted).toContainEqual(expect.objectContaining({ type: 'sse-opened', status: 200 }));
    expect(emitted).toContainEqual(expect.objectContaining({ type: 'sse-event-received' }));
  });

  it('applies and stores workspace cookies across REST, GraphQL, and SSE executions', async () => {
    const requests: Request[] = [];
    const transport: RequestTransport = {
      async send(request) {
        requests.push(request.clone());
        return request.headers.get('accept') === 'text/event-stream'
          ? new Response('data: complete\n\n', { headers: { 'content-type': 'text/event-stream' } })
          : new Response('{}', {
              headers: requests.length === 1 ? { 'set-cookie': 'session=shared; Path=/; HttpOnly' } : {},
            });
      },
    };
    const cookieJar = new WorkspaceCookieJar(new InMemoryCookieRepository(), { generateId: () => 'session' });
    const rest = restEntity({ id: 'rest' });
    const graphql = graphqlEntity({ id: 'graphql' });
    const sse = sseEntity({ id: 'sse', url: 'https://example.test/events', reconnect: { enabled: false, retryMs: 1 } });
    const fixture = workspace({ entities: [rest, graphql, sse] });
    const service = serviceFor(new BehaviorRuntime(), transport, fixture, { cookies: cookieJar });

    await service.execute({ workspaceId: fixture.id, entityId: rest.id });
    await service.execute({ workspaceId: fixture.id, entityId: graphql.id });
    await service.execute({ workspaceId: fixture.id, entityId: sse.id, options: { maxEvents: 1 } });

    expect(requests[0]?.headers.get('cookie')).toBeNull();
    expect(requests[1]?.headers.get('cookie')).toBe('session=shared');
    expect(requests[2]?.headers.get('cookie')).toBe('session=shared');
  });

  it('reports malformed response cookies without exposing their values', async () => {
    const cookies = new WorkspaceCookieJar(new InMemoryCookieRepository());
    const result = await serviceFor(
      new BehaviorRuntime(),
      new RecordingTransport(new Response('{}', { headers: { 'set-cookie': 'secret=value; Domain=invalid.test' } })),
      workspace(),
      { cookies },
    ).execute({ workspaceId: 'workspace-1', entityId: 'rest-1' });

    expect(result.diagnostics).toContainEqual({
      code: 'INVALID_SET_COOKIE',
      message: 'Ignored a Set-Cookie header: Cookie domain does not match the response URL',
      severity: 'warning',
    });
    expect(JSON.stringify(result.diagnostics)).not.toContain('secret=value');
  });

  it('preserves an explicit Cookie header and does not expose Set-Cookie values in stream-open events', async () => {
    const emitted: unknown[] = [];
    const repository = new InMemoryCookieRepository();
    const cookies = new WorkspaceCookieJar(repository, { generateId: () => 'stored' });
    await cookies.upsert('workspace-1', { name: 'stored', value: 'jar', domain: 'example.test' });
    const entity = restEntity({ headers: [{ key: 'cookie', value: 'manual=value', enabled: true }] });
    const transport = new RecordingTransport(
      new Response('data: event\n\n', {
        headers: { 'content-type': 'text/event-stream', 'set-cookie': 'secret=response; Path=/' },
      }),
    );
    await serviceFor(new BehaviorRuntime(), transport, workspace({ entities: [entity] }), {
      cookies,
      events: { emit: (event) => void emitted.push(event) },
    }).execute({ workspaceId: 'workspace-1', entityId: entity.id });

    expect(transport.requests[0]?.headers.get('cookie')).toBe('manual=value');
    expect(JSON.stringify(emitted)).not.toContain('secret=response');
  });

  it('keeps live cookie headers available but excludes them from persisted execution history', async () => {
    const history: ExecutionRecord[] = [];
    const entity = restEntity({ headers: [{ key: 'cookie', value: 'session=request-secret', enabled: true }] });
    const result = await serviceFor(
      new BehaviorRuntime(),
      new RecordingTransport(
        new Response('{}', {
          headers: { 'content-type': 'application/json', 'set-cookie': 'session=response-secret; Path=/' },
        }),
      ),
      workspace({ entities: [entity] }),
      { history: { save: async (record) => void history.push(record) } },
    ).execute({ workspaceId: 'workspace-1', entityId: entity.id });

    expect(result.request?.headers).toContainEqual(['cookie', 'session=request-secret']);
    expect(result.response?.headers).toContainEqual(['set-cookie', 'session=response-secret; Path=/']);
    expect(JSON.stringify(history)).not.toContain('request-secret');
    expect(JSON.stringify(history)).not.toContain('response-secret');
  });

  it('cancels the response reader after reaching the requested SSE event limit', async () => {
    let readerCancelled = false;
    const entity = sseEntity({ reconnect: { enabled: true, retryMs: 1 } });
    const transport: RequestTransport = {
      async send() {
        return new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('id: 1\ndata: first\n\nid: 2\ndata: second\n\n'));
            },
            cancel() {
              readerCancelled = true;
            },
          }),
          { headers: { 'content-type': 'text/event-stream' } },
        );
      },
    };

    const result = await serviceFor(new BehaviorRuntime(), transport, workspace({ entities: [entity] })).execute({
      workspaceId: 'workspace-1',
      entityId: entity.id,
      options: { maxEvents: 1 },
    });

    expect(result.status).toBe('completed');
    expect(result.events).toHaveLength(1);
    expect(readerCancelled).toBe(true);
  });

  it('cancels an active SSE stream without waiting for another event', async () => {
    const entity = sseEntity({ reconnect: { enabled: true, retryMs: 1 } });
    const transport: RequestTransport = {
      async send() {
        return new Response(new ReadableStream<Uint8Array>(), { headers: { 'content-type': 'text/event-stream' } });
      },
    };
    const service = serviceFor(new BehaviorRuntime(), transport, workspace({ entities: [entity] }));
    const running = service.execute({ workspaceId: 'workspace-1', entityId: entity.id, executionId: 'active-sse' });
    await Promise.resolve();
    await Promise.resolve();
    expect(service.cancel('active-sse')).toBe(true);
    await expect(running).resolves.toMatchObject({ status: 'cancelled' });
  });

  it('classifies explicit cancellation and execution timeouts', async () => {
    const waiting = restEntity({ scripts: { lifecycle: script('waiting', 'wait') } });
    const fixture = workspace({ entities: [waiting] });
    const service = serviceFor(new BehaviorRuntime(), new RecordingTransport(), fixture);
    const execution = service.execute({ workspaceId: fixture.id, entityId: waiting.id, executionId: 'cancel-me' });
    await Promise.resolve();
    expect(service.cancel('cancel-me')).toBe(true);
    const cancelled = await execution;
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.error?.code).toBe(YasumuErrorCodes.ExecutionCancelled);

    const timedOut = await serviceFor(new BehaviorRuntime(), new RecordingTransport(), fixture).execute({
      workspaceId: fixture.id,
      entityId: waiting.id,
      options: { timeoutMs: 5 },
    });
    expect(timedOut.status).toBe('cancelled');
    expect(timedOut.error?.code).toBe(YasumuErrorCodes.RequestTimeout);
  });

  it('serializes hook failures and redacts secrets from results and event logs', async () => {
    const runtime = new BehaviorRuntime();
    const events: unknown[] = [];
    const entity = restEntity({
      headers: [{ key: 'authorization', value: 'Bearer {{TOKEN}}', enabled: true }],
      scripts: { lifecycle: script('logger', 'log-secret') },
    });
    const fixture = workspace({
      entities: [entity],
      environments: [environment({ id: 'active', secrets: [{ key: 'TOKEN', enabled: true }] })],
      activeEnvironmentId: 'active',
    });
    const result = await serviceFor(runtime, new RecordingTransport(), fixture, {
      events: { emit: (event) => void events.push(event) },
      secrets: { resolve: async () => ({ TOKEN: 'super-secret' }) },
    }).execute({ workspaceId: fixture.id, entityId: entity.id });

    expect(JSON.stringify(result)).not.toContain('super-secret');
    expect(result.request?.headers).toContainEqual(['authorization', 'Bearer [REDACTED]']);
    expect(result.logs.every((log) => log.message === 'token=[REDACTED]')).toBe(true);
    expect(JSON.stringify(events)).not.toContain('super-secret');

    const broken = restEntity({ scripts: { lifecycle: script('broken', 'throw') } });
    const failure = await serviceFor(
      new BehaviorRuntime(),
      new RecordingTransport(),
      workspace({ entities: [broken] }),
    ).execute({ workspaceId: 'workspace-1', entityId: broken.id });
    expect(failure).toMatchObject({
      status: 'failed',
      error: { code: YasumuErrorCodes.HookExecutionError, message: 'onRequest failed in broken' },
    });
  });

  it('redacts secrets created by a script before returning or persisting results', async () => {
    const events: unknown[] = [];
    const history: unknown[] = [];
    const entity = restEntity({ scripts: { lifecycle: script('secret-writer', 'set-new-secret') } });
    const result = await serviceFor(
      new BehaviorRuntime(),
      new RecordingTransport(),
      workspace({ entities: [entity] }),
      {
        events: { emit: (event) => void events.push(event) },
        history: { save: async (record) => void history.push(record) },
      },
    ).execute({ workspaceId: 'workspace-1', entityId: entity.id });

    expect(result.logs.every((log) => !log.message.includes('runtime-secret'))).toBe(true);
    expect(JSON.stringify({ result, events, history })).not.toContain('runtime-secret');
    expect(JSON.stringify(result)).toContain('[REDACTED]');
  });

  it('retains redaction for secrets replaced during script execution', async () => {
    const entity = restEntity({ scripts: { lifecycle: script('secret-rotator', 'rotate-secret') } });
    const fixture = workspace({
      entities: [entity],
      environments: [environment({ id: 'active', secrets: [{ key: 'TOKEN', enabled: true }] })],
      activeEnvironmentId: 'active',
    });
    const result = await serviceFor(new BehaviorRuntime(), new RecordingTransport(), fixture, {
      secrets: { resolve: async () => ({ TOKEN: 'original-secret' }) },
    }).execute({ workspaceId: fixture.id, entityId: entity.id });

    expect(JSON.stringify(result)).not.toContain('original-secret');
    expect(JSON.stringify(result)).not.toContain('replacement-secret');
    expect(result.logs[0]?.message).toBe('old=[REDACTED]; new=[REDACTED]');
  });

  it('enforces the configured nested execution depth', async () => {
    const runtime = new BehaviorRuntime();
    const recursive = restEntity({
      id: 'recursive',
      scripts: { lifecycle: script('recursive-life', 'nested:rest:recursive') },
    });
    const result = await serviceFor(runtime, new RecordingTransport(), workspace({ entities: [recursive] }), {
      maxNestingDepth: 1,
    }).execute({ workspaceId: 'workspace-1', entityId: recursive.id });

    expect(result.status).toBe('completed');
    expect(result.nestedExecutions[0]?.status).toBe('failed');
    expect(result.nestedExecutions[0]?.error?.code).toBe(YasumuErrorCodes.HookExecutionError);
    expect(result.nestedExecutions[0]?.error?.cause?.code).toBe(YasumuErrorCodes.NestingDepthExceeded);
  });
});

function waitForAbort(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) return reject(signal.reason);
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
}
