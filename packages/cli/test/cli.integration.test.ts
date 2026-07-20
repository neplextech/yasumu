import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { YasumuWorkspace } from '@yasumu/headless';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { NodeWorkspaceFileResolver } from '../src/filesystem.js';

interface CliResult {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
}

const cliPath = fileURLToPath(new URL('../dist/index.js', import.meta.url));
const validFixture = fileURLToPath(new URL('./fixtures/valid', import.meta.url));
const dotenvFixture = fileURLToPath(new URL('./fixtures/valid/precedence.env', import.meta.url));
const invalidFixture = fileURLToPath(new URL('./fixtures/invalid', import.meta.url));

let server: Server;
let baseUrl: string;
let slowRequestStarted: (() => void) | undefined;
let lastAuthorization: string | undefined;

beforeAll(async () => {
  server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', baseUrl);
    const body = await readBody(request);

    if (url.pathname === '/slow' && url.searchParams.get('delay') === '1') {
      slowRequestStarted?.();
      request.once('close', () => response.destroy());
      return;
    }
    if (url.pathname === '/slow') return json(response, 200, { slow: false });
    if (url.pathname === '/rest') {
      const authorization = request.headers.authorization;
      lastAuthorization = authorization;
      if (authorization === 'Bearer fail') return json(response, 503, { failed: true });
      return json(response, 200, { authorization, body: JSON.parse(body) });
    }
    if (url.pathname === '/graphql') {
      return json(response, 200, { data: { status: 'ok' }, request: JSON.parse(body) });
    }
    if (url.pathname === '/file') return json(response, 200, { body });
    return json(response, 404, { error: 'not found' });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP test server address');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

describe('Yasumu CLI headless integration', () => {
  test('validates the cwd/yasumu workspace and emits machine-readable output', async () => {
    const result = await runCli(['validate', '--json'], validFixture);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    expect(parseJson(result.stdout)).toMatchObject({
      ok: true,
      workspace: { id: 'cli-workspace', name: 'CLI integration' },
      diagnostics: [],
    });
  });

  test('lists REST, GraphQL, and SSE entities deterministically, including module aliases', async () => {
    const result = await runCli(['list', '--json'], validFixture);
    const payload = parseJson(result.stdout) as { entities: Array<{ id: string; kind: string }> };

    expect(result.code).toBe(0);
    expect(payload.entities.map((entity) => entity.id)).toEqual([
      'graphql-query',
      'chained',
      'file-upload',
      'mocked',
      'network',
      'slow',
      'tested',
      'echo-stream',
    ]);

    const legacy = await runCli(['rest', 'list', '--json'], validFixture);
    const legacyPayload = parseJson(legacy.stdout) as { entities: Array<{ kind: string }> };
    expect(legacy.code).toBe(0);
    expect(legacyPayload.entities.every((entity) => entity.kind === 'rest')).toBe(true);

    const sse = await runCli(['sse', 'list', '--json'], validFixture);
    const ssePayload = parseJson(sse.stdout) as { entities: Array<{ kind: string }> };
    expect(sse.code).toBe(0);
    expect(ssePayload.entities).toEqual([expect.objectContaining({ kind: 'sse' })]);
  });

  test('executes REST with environment selection, variable overrides, and secret injection', async () => {
    lastAuthorization = undefined;
    const result = await runCli(
      [
        'run',
        'network',
        '--environment',
        'Integration',
        '--variable',
        `BASE_URL=${baseUrl}`,
        '--variable',
        'SOURCE=cli',
        '--secret',
        'TOKEN=cli-secret',
        '--json',
      ],
      validFixture,
    );
    const payload = parseJson(result.stdout) as ExecutionPayload;

    expect(result.code).toBe(0);
    expect(lastAuthorization).toBe('Bearer cli-secret');
    expect(payload.ok).toBe(true);
    expect(payload.results[0]?.response?.body).toMatchObject({
      kind: 'json',
      value: { authorization: 'Bearer [REDACTED]', body: { from: 'cli' } },
    });
  });

  test('loads an explicit dotenv file and applies execution environment precedence consistently', async () => {
    lastAuthorization = undefined;
    const dotenv = await runCli(
      [
        'run',
        'network',
        '--environment',
        'Integration',
        '--dotenv',
        'precedence.env',
        '--variable',
        `BASE_URL=${baseUrl}`,
        '--json',
      ],
      validFixture,
    );
    const dotenvPayload = parseJson(dotenv.stdout) as ExecutionPayload;
    expect(dotenv.code).toBe(0);
    expect(lastAuthorization).toBe('Bearer dotenv-secret');
    expect(dotenvPayload.results[0]?.response?.body).toMatchObject({
      kind: 'json',
      value: { authorization: 'Bearer [REDACTED]', body: { from: 'dotenv' } },
    });

    lastAuthorization = undefined;
    const process = await runCli(
      [
        'test',
        'network',
        '--environment',
        'Integration',
        '--dotenv',
        dotenvFixture,
        '--variable',
        `BASE_URL=${baseUrl}`,
        '--json',
      ],
      validFixture,
      { YASUMU_VAR_SOURCE: 'process', YASUMU_ENV_TOKEN: 'process-secret' },
    );
    const processPayload = parseJson(process.stdout) as ExecutionPayload;
    expect(process.code).toBe(0);
    expect(lastAuthorization).toBe('Bearer process-secret');
    expect(processPayload.results[0]?.response?.body).toMatchObject({
      kind: 'json',
      value: { authorization: 'Bearer [REDACTED]', body: { from: 'process' } },
    });

    lastAuthorization = undefined;
    const explicit = await runCli(
      [
        'rest',
        'run',
        'network',
        '--environment',
        'Integration',
        '--dotenv',
        'precedence.env',
        '--variable',
        `BASE_URL=${baseUrl}`,
        '--variable',
        'SOURCE=explicit',
        '--secret',
        'TOKEN=explicit-secret',
        '--json',
      ],
      validFixture,
      { YASUMU_VAR_SOURCE: 'process', YASUMU_ENV_TOKEN: 'process-secret' },
    );
    const explicitPayload = parseJson(explicit.stdout) as ExecutionPayload;
    expect(explicit.code).toBe(0);
    expect(lastAuthorization).toBe('Bearer explicit-secret');
    expect(explicitPayload.results[0]?.response?.body).toMatchObject({
      kind: 'json',
      value: { authorization: 'Bearer [REDACTED]', body: { from: 'explicit' } },
    });
  });

  test('executes GraphQL through the same headless transport', async () => {
    const result = await runCli(['run', 'graphql-query', '--variable', `BASE_URL=${baseUrl}`, '--json'], validFixture);
    const payload = parseJson(result.stdout) as ExecutionPayload;

    expect(result.code).toBe(0);
    expect(payload.results[0]?.entityKind).toBe('graphql');
    expect(payload.results[0]?.response?.body).toMatchObject({
      kind: 'json',
      value: {
        data: { status: 'ok' },
        request: { query: 'query CliIntegration { status }' },
      },
    });
  });

  test('resolves echo.yasumu.local and streams fully interpolated SSE requests', async () => {
    const result = await runCli(
      ['sse', 'run', 'echo-stream', '--variable', 'SOURCE=cli-sse', '--max-events', '2', '--json'],
      validFixture,
    );
    const payload = parseJson(result.stdout) as ExecutionPayload;

    expect(result.code).toBe(0);
    expect(payload.results[0]).toMatchObject({ entityKind: 'sse', status: 'completed' });
    expect(payload.results[0]?.events).toHaveLength(2);
    expect(payload.results[0]?.events?.[0]).toMatchObject({ event: 'echo', id: '1' });
    expect(payload.results[0]?.events?.[1]).toMatchObject({ event: 'echo', id: '2' });
    expect(JSON.parse(payload.results[0]?.events?.[0]?.data ?? '{}')).toMatchObject({
      method: 'POST',
      headers: { 'x-source': 'cli-sse' },
      query: { count: '1', retry: '1' },
      body: '{"source":"cli-sse"}',
    });
    expect(JSON.parse(payload.results[0]?.events?.[1]?.data ?? '{}')).toMatchObject({
      headers: { 'last-event-id': '1' },
      sequence: 2,
    });
  });

  test('returns mocked responses from Node lifecycle scripts', async () => {
    const result = await runCli(['run', 'mocked', '--json'], validFixture);
    const payload = parseJson(result.stdout) as ExecutionPayload;

    expect(result.code).toBe(0);
    expect(payload.results[0]).toMatchObject({
      status: 'completed',
      isMockResponse: true,
      response: { status: 202, body: { kind: 'json', value: { mocked: true } } },
    });
  });

  test('supports chained entity execution and exposes nested results', async () => {
    const result = await runCli(['run', 'chained', '--json'], validFixture);
    const payload = parseJson(result.stdout) as ExecutionPayload;

    expect(result.code).toBe(0);
    expect(payload.results[0]?.response).toMatchObject({
      status: 207,
      body: { kind: 'json', value: { childId: 'mocked', childStatus: 202 } },
    });
    expect(payload.results[0]?.nestedExecutions).toMatchObject([
      { entityId: 'mocked', status: 'completed', response: { status: 202 } },
    ]);
  });

  test('opens workspace files for binary request bodies', async () => {
    const result = await runCli(['run', 'file-upload', '--variable', `BASE_URL=${baseUrl}`, '--json'], validFixture);
    const payload = parseJson(result.stdout) as ExecutionPayload;

    expect(result.code).toBe(0);
    expect(payload.results[0]?.response?.body).toMatchObject({
      kind: 'json',
      value: { body: 'CLI file payload\n' },
    });
  });

  test('keeps workspace file references relative when the workspace root is reached through a symlink', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'yasumu-cli-files-'));
    try {
      const canonicalRoot = join(directory, 'canonical');
      const aliasedRoot = join(directory, 'aliased');
      await mkdir(join(canonicalRoot, 'fixtures'), { recursive: true });
      await writeFile(join(canonicalRoot, 'fixtures', 'input.txt'), 'input');
      await symlink(canonicalRoot, aliasedRoot, 'junction');

      const workspace: YasumuWorkspace = {
        id: 'aliased-root',
        name: 'Aliased root',
        version: 1,
        root: aliasedRoot,
        entities: [],
        groups: [],
        environments: [],
        metadata: {},
        origin: { kind: 'memory' },
      };
      const file = await new NodeWorkspaceFileResolver().resolve(workspace, 'fixtures/input.txt');

      expect(file.source).toEqual({ type: 'workspace-path', path: 'fixtures/input.txt' });
      expect(file.id).toBe('workspace:fixtures/input.txt');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  test('runs one entity test and the complete workspace test suite', async () => {
    const single = await runCli(['test', 'tested', '--json'], validFixture);
    const singlePayload = parseJson(single.stdout) as ExecutionPayload;
    expect(single.code).toBe(0);
    expect(singlePayload.summary.tests).toMatchObject({ total: 1, passed: 1, failed: 0 });
    expect(singlePayload.results[0]?.tests).toMatchObject([
      { suite: ['CLI'], test: 'receives the mocked response', result: 'pass' },
    ]);

    const all = await runCli(
      [
        'test',
        '--environment',
        'Integration',
        '--variable',
        `BASE_URL=${baseUrl}`,
        '--secret',
        'TOKEN=cli-secret',
        '--json',
      ],
      validFixture,
    );
    const allPayload = parseJson(all.stdout) as ExecutionPayload;
    expect(all.code).toBe(0);
    expect(allPayload.summary).toMatchObject({ selected: 8, completed: 8, failed: 0 });
    expect(allPayload.summary.tests).toMatchObject({ total: 1, passed: 1, failed: 0 });
  }, 20_000);

  test('returns deterministic validation, usage, and execution exit codes in JSON mode', async () => {
    const invalid = await runCli(['validate', '--json'], invalidFixture);
    const invalidPayload = parseJson(invalid.stdout) as {
      ok: boolean;
      diagnostics: Array<{ code: string; range?: object }>;
    };
    expect(invalid.code).toBe(2);
    expect(invalidPayload.ok).toBe(false);
    expect(invalidPayload.diagnostics).toMatchObject([{ code: 'INVALID_YSL', range: expect.any(Object) }]);

    const missing = await runCli(['run', 'missing', '--json'], validFixture);
    expect(missing.code).toBe(2);
    expect(parseJson(missing.stdout)).toMatchObject({ ok: false, error: { code: 'INVALID_ARGUMENT' } });

    const missingDotenv = await runCli(['run', 'mocked', '--dotenv', 'missing.env', '--json'], validFixture);
    expect(missingDotenv.code).toBe(2);
    expect(parseJson(missingDotenv.stdout)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_ARGUMENT', message: expect.stringContaining('Unable to read dotenv file') },
    });

    const failed = await runCli(
      [
        'run',
        'network',
        '--environment',
        'Integration',
        '--variable',
        `BASE_URL=${baseUrl}`,
        '--secret',
        'TOKEN=fail',
        '--json',
      ],
      validFixture,
    );
    expect(failed.code).toBe(1);
    expect(parseJson(failed.stdout)).toMatchObject({ ok: false, summary: { failed: 1 } });
  });

  test('cancels an active execution on SIGINT and exits with 130', async () => {
    let markStarted: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    slowRequestStarted = markStarted;
    const running = startCli(
      ['run', 'slow', '--variable', `BASE_URL=${baseUrl}`, '--variable', 'DELAY=1', '--json'],
      validFixture,
    );

    await started;
    running.child.kill('SIGINT');
    const result = await running.done;
    slowRequestStarted = undefined;

    expect(result.code).toBe(130);
    expect(parseJson(result.stdout)).toMatchObject({
      ok: false,
      summary: { cancelled: 1 },
      results: [{ status: 'cancelled' }],
    });
  }, 10_000);
});

interface ExecutionPayload {
  ok: boolean;
  summary: {
    selected: number;
    completed: number;
    failed: number;
    cancelled: number;
    tests: { total: number; passed: number; failed: number; skipped: number };
  };
  results: Array<{
    entityKind: string;
    status: string;
    isMockResponse: boolean;
    response?: { status: number; body: { kind: string; value?: unknown } };
    tests: unknown[];
    nestedExecutions: unknown[];
    events?: Array<{ id?: string; event: string; data: string }>;
  }>;
}

function startCli(
  args: string[],
  cwd: string,
  environment: NodeJS.ProcessEnv = {},
): { child: ChildProcessWithoutNullStreams; done: Promise<CliResult> } {
  const childEnvironment = { ...process.env };
  for (const name of [
    'BASE_URL',
    'SOURCE',
    'TOKEN',
    'DELAY',
    'YASUMU_VAR_BASE_URL',
    'YASUMU_VAR_SOURCE',
    'YASUMU_VAR_DELAY',
    'YASUMU_ENV_TOKEN',
  ]) {
    delete childEnvironment[name];
  }
  Object.assign(childEnvironment, environment, { NO_COLOR: '1' });
  const child = spawn(process.execPath, [cliPath, ...args], {
    cwd,
    env: childEnvironment,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', (chunk: string) => (stdout += chunk));
  child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr += chunk));
  const done = new Promise<CliResult>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
  return { child, done };
}

function runCli(args: string[], cwd: string, environment?: NodeJS.ProcessEnv): Promise<CliResult> {
  return startCli(args, cwd, environment).done;
}

function parseJson(value: string): unknown {
  return JSON.parse(value) as unknown;
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

function json(response: ServerResponse, status: number, value: object): void {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(value));
}
