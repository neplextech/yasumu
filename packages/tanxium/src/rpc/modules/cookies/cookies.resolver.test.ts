import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import type { WorkspaceCookie, WorkspaceCookieInput } from '@yasumu/headless';

import type { CookiesService } from './cookies.service.ts';

const databaseRoot = Deno.makeTempDirSync({ prefix: 'yasumu-cookies-rpc-' });
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

Deno.test('cookies resolver forwards every operation with the active workspace scope', async () => {
  const { CookiesResolver } = await import('./cookies.resolver.ts');
  const calls: unknown[][] = [];
  const cookie = {
    id: 'cookie',
    workspaceId: 'workspace',
    name: 'session',
    value: 'value',
    domain: 'example.test',
    path: '/',
    expiresAt: null,
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    hostOnly: true,
    createdAt: 1,
    updatedAt: 1,
  } satisfies WorkspaceCookie;
  const service = {
    list(workspaceId: string) {
      calls.push(['list', workspaceId]);
      return Promise.resolve([cookie]);
    },
    upsert(workspaceId: string, input: WorkspaceCookieInput) {
      calls.push(['upsert', workspaceId, input]);
      return Promise.resolve(cookie);
    },
    delete(workspaceId: string, cookieId: string) {
      calls.push(['delete', workspaceId, cookieId]);
      return Promise.resolve();
    },
    clear(workspaceId: string) {
      calls.push(['clear', workspaceId]);
      return Promise.resolve();
    },
    resolve(workspaceId: string, url: string) {
      calls.push(['resolve', workspaceId, url]);
      return Promise.resolve('session=value');
    },
    ingest(workspaceId: string, url: string, headers: string[]) {
      calls.push(['ingest', workspaceId, url, headers]);
      return Promise.resolve({ stored: [cookie], rejected: [] });
    },
  };
  const resolver = new CookiesResolver(service as CookiesService);
  const input = { name: 'session', value: 'value', domain: 'example.test' };

  assert.deepEqual(await resolver.list('workspace'), [cookie]);
  assert.equal(await resolver.upsert('workspace', input), cookie);
  await resolver.delete('workspace', 'cookie');
  await resolver.clear('workspace');
  assert.equal(await resolver.resolve('workspace', 'https://example.test'), 'session=value');
  assert.deepEqual(await resolver.ingest('workspace', 'https://example.test', ['session=value']), {
    stored: [cookie],
    rejected: [],
  });
  assert.deepEqual(calls, [
    ['list', 'workspace'],
    ['upsert', 'workspace', input],
    ['delete', 'workspace', 'cookie'],
    ['clear', 'workspace'],
    ['resolve', 'workspace', 'https://example.test'],
    ['ingest', 'workspace', 'https://example.test', ['session=value']],
  ]);

  const { db } = await import('../../../database/index.ts');
  db.$client.close();
  await Promise.all([
    Deno.remove(databaseRoot, { recursive: true }),
    Deno.remove(join(Deno.cwd(), 'file:'), { recursive: true }),
  ]);
});
