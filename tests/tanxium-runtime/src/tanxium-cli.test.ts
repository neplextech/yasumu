import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createConnection } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const binary = join(root, 'target/debug/tanxium');
const workspace = mkdtempSync(join(tmpdir(), 'tanxium-runtime-'));
const tanxiumPackage = join(root, 'packages/tanxium');

function runEntrypoint(
  entrypoint: string,
  {
    verbose = false,
    sandbox,
    noSandbox = false,
    allowHttpImports = false,
    timeout = 10_000,
  }: {
    verbose?: boolean;
    sandbox?: boolean;
    noSandbox?: boolean;
    allowHttpImports?: boolean;
    timeout?: number;
  } = {},
) {
  const permissionFlags = [
    ...(sandbox === undefined ? [] : ['--sandbox', String(sandbox)]),
    ...(noSandbox ? ['--no-sandbox'] : []),
    ...(allowHttpImports ? ['--allow-http-imports'] : []),
  ];

  return execFileSync(
    binary,
    [
      ...permissionFlags,
      'run',
      entrypoint,
      '--workspace',
      workspace,
      '--resources',
      workspace,
      ...(verbose ? ['--verbose'] : []),
    ],
    {
      cwd: workspace,
      encoding: 'utf8',
      timeout,
    },
  );
}

function run(source: string, options: { verbose?: boolean; sandbox?: boolean; noSandbox?: boolean } = {}) {
  const entrypoint = join(workspace, 'entry.ts');
  writeFileSync(entrypoint, source);
  return runEntrypoint(entrypoint, options);
}

function runFailure(source: string, filename: string) {
  const entrypoint = join(workspace, filename);
  writeFileSync(entrypoint, source);

  const result = spawnSync(binary, ['run', entrypoint, '--workspace', workspace, '--resources', workspace], {
    cwd: workspace,
    encoding: 'utf8',
    timeout: 60_000,
  });

  if (result.error) {
    throw result.error;
  }

  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

function runFailureAsync(source: string, filename: string, { allowHttpImports = false } = {}): Promise<string> {
  const entrypoint = join(workspace, filename);
  writeFileSync(entrypoint, source);

  return new Promise((resolve, reject) => {
    const child = spawn(
      binary,
      [
        ...(allowHttpImports ? ['--allow-http-imports'] : []),
        'run',
        entrypoint,
        '--workspace',
        workspace,
        '--resources',
        workspace,
      ],
      {
        cwd: workspace,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Tanxium did not finish reporting the source-mapped failure'));
    }, 60_000);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.once('error', reject);
    child.once('close', () => {
      clearTimeout(timeout);
      resolve(`${stdout}${stderr}`);
    });
  });
}

async function sendSmtpMessage(): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = createConnection(5555, '127.0.0.1');
    let transcript = '';
    let sentGreeting = false;
    let sentMessage = false;

    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`SMTP server did not finish the exchange:\n${transcript}`));
    }, 5_000);

    socket.on('data', (chunk: Buffer) => {
      transcript += chunk.toString();

      if (!sentGreeting && transcript.includes('220 ')) {
        sentGreeting = true;
        socket.write('EHLO localhost\r\n');
      }

      if (!sentMessage && transcript.includes('250 ')) {
        sentMessage = true;
        socket.write(
          'MAIL FROM:<sender@example.com>\r\nRCPT TO:<receiver@example.com>\r\nDATA\r\nSubject: Tanxium SMTP test\r\n\r\nHello from Tanxium\r\n.\r\nQUIT\r\n',
        );
      }

      if (transcript.includes('250 OK: message queued')) {
        socket.end();
      }
    });
    socket.once('error', reject);
    socket.once('close', () => {
      clearTimeout(timeout);
      resolve(transcript);
    });
  });
}

beforeAll(() => {
  execFileSync('cargo', ['build', '-p', 'tanxium-cli'], {
    cwd: root,
    stdio: 'inherit',
  });
}, 10 * 60_000);

afterAll(() => rmSync(workspace, { recursive: true, force: true }));

describe('tanxium CLI runtime semantics', () => {
  it('executes TypeScript and exposes Yasumu workspace/resource context', () => {
    const output = run(/* js */ `
      const value: number = 40 + 2;
      console.log(JSON.stringify({ value, workspace: Yasumu.getWorkspaceDir(), resources: Yasumu.getResourcesDir() }));
    `);
    const result = JSON.parse(
      output
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.includes('"workspace"'))!,
    );

    expect(result).toMatchObject({ value: 42, workspace });
    expect(result.resources).toBe(join(workspace, 'resources'));
  });

  it('applies inline source maps to error stack traces', () => {
    writeFileSync(
      join(workspace, 'inline-original.ts'),
      'export function fail() {\n  throw new Error("inline map failure");\n}\nfail();\n',
    );
    const sourceMap = Buffer.from(
      JSON.stringify({
        version: 3,
        sources: ['inline-original.ts'],
        sourcesContent: ['export function fail() {\n  throw new Error("inline map failure");\n}\nfail();\n'],
        names: [],
        mappings: 'AAAA;AACA;AACA;AACA',
      }),
    ).toString('base64');

    const error = runFailure(
      /* js */ `
      export function fail() {
        throw new Error('inline map failure');
      }
      fail();
      ${'//# source' + `MappingURL=data:application/json;base64,${sourceMap}`}
    `,
      'inline-entry.js',
    );

    expect(error).toContain('inline-original.ts');
  }, 30_000);

  it('lazily loads external source maps for error stack traces', () => {
    const sourceMapPath = join(workspace, 'external-entry.js.map');
    const originalPath = join(workspace, 'external-original.ts');
    writeFileSync(originalPath, 'export function fail() {\n  throw new Error("external map failure");\n}\nfail();\n');
    writeFileSync(
      sourceMapPath,
      JSON.stringify({
        version: 3,
        sources: ['external-original.ts'],
        sourcesContent: ['export function fail() {\n  throw new Error("external map failure");\n}\nfail();\n'],
        names: [],
        mappings: 'AAAA;AACA;AACA;AACA',
      }),
    );

    const error = runFailure(
      /* js */ `
      export function fail() {
        throw new Error('external map failure');
      }
      fail();
      ${'//# source' + 'MappingURL=external-entry.js.map'}
    `,
      'external-entry.js',
    );

    expect(error).toContain('external-original.ts');
  }, 30_000);

  it('loads HTTP modules with external source maps', async () => {
    const originalSource = 'export function fail(): never {\n  throw new Error("remote map failure");\n}\nfail();\n';
    const sourceMap = JSON.stringify({
      version: 3,
      sources: ['remote-original.ts'],
      sourcesContent: [originalSource],
      names: [],
      mappings: 'AAAA;AACA;AACA;AACA',
    });
    const generatedSource =
      'export function fail() {\n  throw new Error("remote map failure");\n}\nfail();\n//# sourceMappingURL=remote-entry.js.map\n';
    const server = createServer((request, response) => {
      const content =
        request.url === '/remote-entry.js'
          ? generatedSource
          : request.url === '/remote-entry.js.map'
            ? sourceMap
            : request.url === '/remote-original.ts'
              ? originalSource
              : undefined;

      if (content === undefined) {
        response.writeHead(404).end();
        return;
      }

      response.writeHead(200, { 'Content-Type': 'application/javascript' });
      response.end(request.method === 'HEAD' ? undefined : content);
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (address === null || typeof address === 'string') {
      throw new Error('Unable to determine the HTTP fixture server address');
    }

    try {
      const entrypoint = /* js */ `await import('http://127.0.0.1:${address.port}/remote-entry.js');`;
      const denied = await runFailureAsync(entrypoint, 'remote-entry.ts');
      expect(denied).toContain('HTTP imports are disabled');

      const error = await runFailureAsync(entrypoint, 'remote-entry.ts', {
        allowHttpImports: true,
      });

      expect(error).toContain('remote-original.ts');
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }, 60_000);

  it('loads registered virtual modules through the Yasumu module loader', () => {
    const output = run(/* js */ `
      Yasumu.registerVirtualModule('answer', 'export const answer: number = 42');
      const module = await import('yasumu:virtual/answer');
      console.log(module.answer);
    `);

    expect(output).toContain('42');
    expect(output).not.toContain('"type":"console"');
  });

  it('shares main virtual modules with workers without allowing worker registration', () => {
    const output = run(/* js */ `
      Yasumu.registerVirtualModule('shared', 'export const answer: number = 42');

      const workerSource = \`
        Yasumu.registerVirtualModule('worker-only', 'export const answer = 0');

        let workerRegistrationWasIgnored = false;
        try {
          await import('yasumu:virtual/worker-only');
        } catch {
          workerRegistrationWasIgnored = true;
        }

        const shared = await import('yasumu:virtual/shared');
        postMessage({ answer: shared.answer, workerRegistrationWasIgnored });
      \`;
      const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: 'application/javascript' }));
      const worker = new Worker(workerUrl, { type: 'module' });
      const result = await new Promise((resolve, reject) => {
        worker.onmessage = (event) => resolve(event.data);
        worker.onerror = (event) => reject(event.message);
      });
      worker.terminate();
      URL.revokeObjectURL(workerUrl);

      console.log(JSON.stringify(result));
    `);

    expect(JSON.parse(output.trim())).toEqual({
      answer: 42,
      workerRegistrationWasIgnored: true,
    });
  });

  it('forwards renderer events through the terminal host', () => {
    const output = run(/* js */ `Yasumu.postMessage({ type: 'runtime-event', value: 42 });`, { verbose: true });

    expect(JSON.parse(output.trim())).toEqual({
      type: 'message',
      payload: { type: 'runtime-event', value: 42 },
    });
  });

  it('sandboxes the main worker by default and supports both permission opt-outs', () => {
    const source = /* js */ `
      const permission = await Deno.permissions.query({ name: 'env' });
      console.log(permission.state);
    `;

    expect(run(source).trim()).toBe('prompt');
    expect(run(source, { sandbox: false }).trim()).toBe('granted');
    expect(run(source, { noSandbox: true }).trim()).toBe('granted');
  });

  it('evaluates multiline input with top-level await in the REPL', () => {
    const output = execFileSync(binary, ['repl', '--workspace', workspace, '--resources', workspace], {
      cwd: workspace,
      encoding: 'utf8',
      input: `const answer = await Promise.resolve(\n  42,\n);\nconsole.log(answer);\n\n.exit\n`,
      timeout: 10_000,
    });

    expect(output).toContain('Tanxium REPL');
    expect(output).toContain('42');
  });

  it('imports an ESM package from the workspace node_modules directory', () => {
    const packageDir = join(workspace, 'node_modules', 'tanxium-fixture');
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(
      join(packageDir, 'package.json'),
      JSON.stringify({
        name: 'tanxium-fixture',
        type: 'module',
        exports: './index.js',
      }),
    );
    writeFileSync(join(packageDir, 'index.js'), `export const value = 'resolved from node_modules';`);

    const output = run(/* js */ `
      import { value } from 'tanxium-fixture';
      console.log(value);
    `);

    expect(output).toContain('resolved from node_modules');
  });

  it('loads CommonJS packages and serves SMTP over Node TCP', async () => {
    const child = spawn(binary, ['--no-sandbox', 'run', './test/smtp-server-test.ts', '--verbose'], {
      cwd: tanxiumPackage,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    let errors = '';
    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      errors += chunk.toString();
    });

    try {
      await new Promise<void>((resolveReady, rejectReady) => {
        const timeout = setTimeout(() => {
          rejectReady(new Error(`SMTP server did not start:\n${output}\n${errors}`));
        }, 5_000);

        child.stdout.on('data', () => {
          if (output.includes('SMTP server is running on port 5555')) {
            clearTimeout(timeout);
            resolveReady();
          }
        });
        child.once('error', rejectReady);
        child.once('exit', (code) => {
          clearTimeout(timeout);
          rejectReady(new Error(`SMTP server exited early with code ${code}:\n${errors}`));
        });
      });

      const transcript = await sendSmtpMessage();
      expect(transcript).toContain('250 OK: message queued');
      expect(output).toContain('Starting SMTP Server on port 5555');
      expect(output).toContain('Received email: Subject: Tanxium SMTP test');
      expect(errors).toBe('');
    } finally {
      if (child.exitCode === null) {
        child.kill('SIGTERM');
        await once(child, 'exit');
      }
    }
  });

  it('passes the shared headless runtime conformance suite', () => {
    const entrypoint = join(root, 'tests/tanxium-runtime/fixtures/headless-runtime-conformance.ts');

    const output = runEntrypoint(entrypoint, {
      noSandbox: true,
      timeout: 120_000,
    });
    const marker = output.split('\n').find((line) => line.startsWith('HEADLESS_CONFORMANCE:'));

    expect(JSON.parse(marker!.slice('HEADLESS_CONFORMANCE:'.length))).toEqual(
      expect.arrayContaining([
        expect.stringContaining('entity identity'),
        expect.stringContaining('host-call-backed'),
        expect.stringContaining('hard timeouts'),
      ]),
    );
  }, 180_000);
});
