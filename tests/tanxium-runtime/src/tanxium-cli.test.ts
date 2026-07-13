import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const binary = join(root, 'target/debug/tanxium');
const workspace = mkdtempSync(join(tmpdir(), 'tanxium-runtime-'));
const tanxiumPackage = join(root, 'packages/tanxium');

function run(
  source: string,
  { verbose = false, sandbox, noSandbox = false }: { verbose?: boolean; sandbox?: boolean; noSandbox?: boolean } = {},
) {
  const entrypoint = join(workspace, 'entry.ts');
  writeFileSync(entrypoint, source);

  const permissionFlags = [
    ...(sandbox === undefined ? [] : ['--sandbox', String(sandbox)]),
    ...(noSandbox ? ['--no-sandbox'] : []),
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
      timeout: 10_000,
    },
  );
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
});

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

  it('loads registered virtual modules through the Yasumu module loader', () => {
    const output = run(/* js */ `
      Yasumu.registerVirtualModule('answer', 'export const answer: number = 42');
      const module = await import('yasumu:virtual/answer');
      console.log(module.answer);
    `);

    expect(output).toContain('42');
    expect(output).not.toContain('"type":"console"');
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
});
