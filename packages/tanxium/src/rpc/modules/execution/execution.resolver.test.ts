import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import type { ExecutionResult } from '@yasumu/headless';

import type { ExecutionService, GuiExecuteEntityInput } from './execution.service.ts';

const databaseRoot = Deno.makeTempDirSync({ prefix: 'yasumu-execution-rpc-' });
const literalDatabaseRoot = join(Deno.cwd(), `file:${databaseRoot}`);
mkdirSync(literalDatabaseRoot, { recursive: true });
Object.defineProperty(globalThis, 'Yasumu', {
  configurable: true,
  value: {
    cuid: () => crypto.randomUUID(),
    getAppDataDir: () => databaseRoot,
    isDevMode: false,
    postMessage: () => Promise.resolve(),
    ui: { showConfirmationDialogSync: () => true },
  },
  writable: true,
});

Deno.test('execution resolver forwards workspace-scoped execution and file registration calls', async () => {
  const { ExecutionResolver } = await import('./execution.resolver.ts');
  const calls: unknown[][] = [];
  const expected = {
    executionId: 'execution',
    status: 'completed',
  } as ExecutionResult;
  const service = {
    execute(workspaceId: string, input: GuiExecuteEntityInput) {
      calls.push(['execute', workspaceId, input]);
      return Promise.resolve(expected);
    },
    cancel(workspaceId: string, executionId: string, reason?: string) {
      calls.push(['cancel', workspaceId, executionId, reason]);
      return true;
    },
    active(workspaceId: string) {
      calls.push(['active', workspaceId]);
      return ['execution'];
    },
    registerFile(workspaceId: string, file: { name: string; bytes: number[]; mimeType?: string }) {
      calls.push(['registerFile', workspaceId, file]);
      return {
        id: 'host:file',
        name: file.name,
        size: file.bytes.length,
        source: { type: 'host-handle' as const, handleId: 'file' },
      };
    },
  };
  const resolver = new ExecutionResolver(service as unknown as ExecutionService);

  assert.equal(await resolver.execute('workspace', { entityId: 'entity' }), expected);
  assert.equal(await resolver.cancel('workspace', 'execution', 'stop'), true);
  assert.deepEqual(await resolver.active('workspace'), ['execution']);
  const file = { name: 'fixture.txt', bytes: [111, 107] };
  assert.deepEqual(await resolver.registerFile('workspace', file), {
    id: 'host:file',
    name: 'fixture.txt',
    size: 2,
    source: { type: 'host-handle', handleId: 'file' },
  });
  assert.deepEqual(calls, [
    ['execute', 'workspace', { entityId: 'entity' }],
    ['cancel', 'workspace', 'execution', 'stop'],
    ['active', 'workspace'],
    ['registerFile', 'workspace', file],
  ]);

  const { db } = await import('../../../database/index.ts');
  db.$client.close();
  await Promise.all([
    Deno.remove(databaseRoot, { recursive: true }),
    Deno.remove(join(Deno.cwd(), 'file:'), { recursive: true }),
  ]);
});
