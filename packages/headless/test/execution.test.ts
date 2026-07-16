import type {
  CreateRuntimeSessionInput,
  InvokeHookOptions,
  RuntimeCapabilities,
  ScriptHookInvocation,
  ScriptHookResult,
  YasumuScriptRuntime,
} from '@yasumu/runtime-api';
import { requestFromSnapshot, snapshotRequest, snapshotResponse } from '@yasumu/runtime-api';
import {
  HeadlessExecutionService,
  InMemoryEntityRepository,
  InMemoryWorkspaceRepository,
  type RequestTransport,
  type RequestTransportContext,
  YasumuErrorCodes,
} from '../src/index.js';
import { describe, expect, it } from 'vitest';

import { environment, graphqlEntity, group, restEntity, script, workspace } from './fixtures.js';

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
          headers: { 'content-type': 'application/json' },
        }),
      );
    }
    if (code.includes('nested:') && invocation.hook === 'onResponse') {
      const [, kind, id] = code.match(/nested:(rest|graphql):([A-Za-z0-9_-]+)/) ?? [];
      await session.hostCall(
        'entity.execute',
        { kind: kind as 'rest' | 'graphql', id: id!, options: { withResponse: true } },
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
        invocation.hook === 'onTest'
          ? [{ test: invocation.source.id, result: 'pass', error: null, duration: 1 }]
          : [],
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
    expect(result.tests.map((test) => test.test)).toEqual(['workspace', 'parent', 'child', 'entity-life', 'entity-test']);
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

  it('applies body limits only to serialized output, not hooks or transport', async () => {
    const runtime = new BehaviorRuntime();
    const transport = new RecordingTransport(
      new Response('abcdefghij', { headers: { 'content-type': 'text/plain' } }),
    );
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
    const result = await serviceFor(new BehaviorRuntime(), new RecordingTransport(), workspace({ entities: [entity] }), {
      events: { emit: (event) => void events.push(event) },
      history: { save: async (record) => void history.push(record) },
    }).execute({ workspaceId: 'workspace-1', entityId: entity.id });

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
    const recursive = restEntity({ id: 'recursive', scripts: { lifecycle: script('recursive-life', 'nested:rest:recursive') } });
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
