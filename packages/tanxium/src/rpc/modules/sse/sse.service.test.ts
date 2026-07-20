import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import * as schema from '../../../database/schema.ts';
import { workspaces } from '../../../database/schema.ts';
import { drizzle } from '../../../database/sqlite/index.ts';
import { migrate } from '../../../database/sqlite/migrator.ts';

const databaseRoot = Deno.makeTempDirSync({ prefix: 'yasumu-sse-rpc-' });
let cuidSequence = 0;
const published: Array<{ type: string; data: unknown }> = [];
Object.defineProperty(globalThis, 'Yasumu', {
  configurable: true,
  value: {
    cuid: () => `sse-cuid-${++cuidSequence}`,
    getAppDataDir: () => databaseRoot,
    isDevMode: false,
    postMessage: (message: { data?: { event?: string; data?: unknown } }) => {
      if (message.data?.event) published.push({ type: message.data.event, data: message.data.data });
      return Promise.resolve();
    },
  },
  writable: true,
});

Deno.test('SSE RPC service persists complete CRUD fields, dependencies, trees, and update events', async () => {
  const database = drizzle(':memory:', { schema });
  migrate(database, { migrationsFolder: fileURLToPath(new URL('../../../../drizzle', import.meta.url)) });
  database.insert(workspaces).values({ id: 'workspace', name: 'Workspace', path: '/workspace' }).run();

  const { SseService } = await import('./sse.service.ts');
  const treeCalls: unknown[] = [];
  const service = new SseService(
    { getConnection: () => database } as never,
    {
      listTree(options: unknown) {
        treeCalls.push(options);
        return Promise.resolve([]);
      },
    } as never,
    {
      publishMessage(type: string, data: unknown) {
        published.push({ type, data });
        return Promise.resolve();
      },
    } as never,
  );

  try {
    const parent = await service.create('workspace', {
      name: 'Parent stream',
      method: 'GET',
      url: 'https://example.test/parent',
      metadata: {},
    });
    const child = await service.create('workspace', {
      name: 'Child stream',
      method: 'POST',
      url: 'https://example.test/child/:id',
      requestHeaders: [{ key: 'authorization', value: 'Bearer {{TOKEN}}', enabled: true }],
      requestParameters: [{ key: 'id', value: '{{ID}}', enabled: true }],
      searchParameters: [{ key: 'topic', value: '{{TOPIC}}', enabled: true }],
      requestBody: { type: 'json', value: '{"active":"{{ACTIVE}}"}', metadata: {} },
      eventTypes: ['{{EVENT_TYPE}}'],
      reconnect: { enabled: true, retryMs: 250 },
      script: { language: 'javascript', code: 'export function onResponse() {}' },
      testScript: { language: 'javascript', code: 'export function onTest() {}' },
      dependencies: [parent.id],
      metadata: {},
    });

    assert.deepEqual((await service.get('workspace', child.id)).dependencies, [parent.id]);
    assert.deepEqual(
      (await service.list('workspace')).map((entity) => ({ id: entity.id, dependencies: entity.dependencies })),
      [
        { id: parent.id, dependencies: [] },
        { id: child.id, dependencies: [parent.id] },
      ],
    );

    const updated = await service.update('workspace', child.id, {
      eventTypes: ['build'],
      reconnect: { enabled: false, retryMs: 500 },
      dependencies: [],
    });
    assert.deepEqual(updated.eventTypes, ['build']);
    assert.deepEqual(updated.reconnect, { enabled: false, retryMs: 500 });
    assert.deepEqual(updated.dependencies, []);

    assert.deepEqual(await service.listTree('workspace'), []);
    assert.deepEqual(treeCalls, [{ workspaceId: 'workspace', entityType: 'sse' }]);

    await service.delete('workspace', parent.id);
    await service.delete('workspace', child.id);
    assert.deepEqual(await service.list('workspace'), []);
    assert.ok(published.some((event) => event.type === 'sse-entity-updated'));
    assert.ok(published.some((event) => event.type === 'entity-history-updated'));
  } finally {
    database.$client.close();
    const { db } = await import('../../../database/index.ts');
    db.$client.close();
    await rm(databaseRoot, { recursive: true, force: true });
  }
});
