import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import * as schema from '../../../database/schema.ts';
import { restEntities, sourceRevisions, sseEntities } from '../../../database/schema.ts';
import { drizzle } from '../../../database/sqlite/index.ts';
import type { HeadlessDrizzleDatabase } from '../../../headless/persistence/database.ts';
import { DrizzleWorkspaceRepository } from '../../../headless/persistence/workspace-repository.ts';
import { GuiWorkspaceReconciler } from './headless-reconciliation.service.ts';

declare global {
  var Yasumu: { cuid(): string };
}

let cuidSequence = 0;
Object.defineProperty(globalThis, 'Yasumu', {
  configurable: true,
  value: { cuid: () => `reconciliation-cuid-${++cuidSequence}` },
  writable: true,
});

const migrationNames = [
  '0000_real_kulan_gath.sql',
  '0001_rare_pride.sql',
  '0002_breezy_unus.sql',
  '0003_late_kitty_pryde.sql',
  '0004_headless_persistence.sql',
  '0005_kind_mentor.sql',
];

Deno.test('GUI reconciliation imports and incrementally adds, updates, and deletes YSL records', async () => {
  await withFixture(async ({ database, reconciler, root }) => {
    await writeWorkspace(root, [restYsl('rest-a', 'A')]);
    await reconciler.importWorkspace(root);

    assert.deepEqual(revisionIds(database), ['rest-a', 'workspace']);

    await writeWorkspace(root, [restYsl('rest-a', 'Source A'), restYsl('rest-b', 'B')]);
    const updated = await reconciler.reconcile('workspace', root);
    assert.equal(updated.conflicts.length, 0);
    assert.equal(statusFor(updated, 'rest-a'), 'source-updated');
    assert.equal(statusFor(updated, 'rest-b'), 'source-added');
    assert.deepEqual(
      database
        .select()
        .from(restEntities)
        .all()
        .map((entity) => entity.name)
        .sort(),
      ['B', 'Source A'],
    );

    await writeWorkspace(root, [restYsl('rest-b', 'B')]);
    const deleted = await reconciler.reconcile('workspace', root);
    assert.equal(statusFor(deleted, 'rest-a'), 'source-deleted');
    assert.deepEqual(
      database
        .select()
        .from(restEntities)
        .all()
        .map((entity) => entity.id),
      ['rest-b'],
    );
    assert.deepEqual(revisionIds(database), ['rest-b', 'workspace']);
  });
});

Deno.test('GUI reconciliation reports field conflicts without mutating data or advancing baselines', async () => {
  await withFixture(async ({ database, reconciler, root }) => {
    await writeWorkspace(root, [restYsl('rest-a', 'Base')]);
    await reconciler.importWorkspace(root);
    const baseline = revision(database, 'rest-a');

    const repository = new DrizzleWorkspaceRepository(database);
    const aggregate = await repository.get('workspace');
    assert.ok(aggregate);
    aggregate.entities[0]!.name = 'Database';
    await repository.save(aggregate);

    assert.deepEqual(revision(database, 'rest-a'), baseline);

    await writeWorkspace(root, [restYsl('rest-a', 'Source')]);
    const report = await reconciler.reconcile('workspace', root);
    assert.equal(statusFor(report, 'rest-a'), 'conflict');
    assert.deepEqual(report.conflicts[0]?.path, ['name']);
    assert.equal(database.select().from(restEntities).get()?.name, 'Database');
    assert.deepEqual(revision(database, 'rest-a'), baseline);
  });
});

Deno.test('GUI reconciliation auto-merges disjoint source and database edits', async () => {
  await withFixture(async ({ database, reconciler, root }) => {
    await writeWorkspace(root, [restYsl('rest-a', 'Base')]);
    await reconciler.importWorkspace(root);

    const repository = new DrizzleWorkspaceRepository(database);
    const aggregate = await repository.get('workspace');
    assert.ok(aggregate);
    aggregate.entities[0]!.url = 'https://database.example/rest-a';
    await repository.save(aggregate);

    await writeWorkspace(root, [restYsl('rest-a', 'Source')]);
    const report = await reconciler.reconcile('workspace', root);
    assert.equal(statusFor(report, 'rest-a'), 'auto-merged');

    const entity = database.select().from(restEntities).get();
    assert.equal(entity?.name, 'Source');
    assert.equal(entity?.url, 'https://database.example/rest-a');
  });
});

Deno.test('GUI reconciliation imports, updates, and deletes complete SSE records', async () => {
  await withFixture(async ({ database, reconciler, root }) => {
    await writeWorkspace(root, [], [sseYsl('stream-a', 'Stream A', 'GET', ['update'], 100)]);
    await reconciler.importWorkspace(root);

    let stream = database.select().from(sseEntities).get();
    assert.equal(stream?.method, 'GET');
    assert.deepEqual(stream?.eventTypes, ['update']);
    assert.deepEqual(stream?.reconnect, { enabled: true, retryMs: 100 });
    assert.deepEqual(revisionIds(database), ['stream-a', 'workspace']);

    await writeWorkspace(root, [], [sseYsl('stream-a', 'Updated stream', 'POST', ['build'], 250)]);
    const updated = await reconciler.reconcile('workspace', root);
    assert.equal(statusFor(updated, 'stream-a'), 'source-updated');
    stream = database.select().from(sseEntities).get();
    assert.equal(stream?.name, 'Updated stream');
    assert.equal(stream?.method, 'POST');
    assert.deepEqual(stream?.eventTypes, ['build']);
    assert.deepEqual(stream?.reconnect, { enabled: true, retryMs: 250 });

    await writeWorkspace(root, []);
    const deleted = await reconciler.reconcile('workspace', root);
    assert.equal(statusFor(deleted, 'stream-a'), 'source-deleted');
    assert.equal(database.select().from(sseEntities).get(), undefined);
    assert.deepEqual(revisionIds(database), ['workspace']);
  });
});

async function withFixture(
  run: (fixture: {
    database: HeadlessDrizzleDatabase;
    reconciler: GuiWorkspaceReconciler;
    root: string;
  }) => Promise<void>,
): Promise<void> {
  const database = await createTestDatabase();
  const root = await Deno.makeTempDir({ prefix: 'yasumu-reconciliation-' });
  try {
    await run({
      database,
      reconciler: new GuiWorkspaceReconciler(database),
      root,
    });
  } finally {
    database.$client.close();
    await rm(root, { recursive: true, force: true });
  }
}

async function writeWorkspace(root: string, restFiles: string[], sseFiles: string[] = []): Promise<void> {
  const yslRoot = join(root, 'yasumu');
  const restRoot = join(yslRoot, 'rest');
  const sseRoot = join(yslRoot, 'sse');
  await rm(restRoot, { recursive: true, force: true });
  await rm(sseRoot, { recursive: true, force: true });
  await mkdir(restRoot, { recursive: true });
  await mkdir(sseRoot, { recursive: true });
  await writeFile(join(yslRoot, 'workspace.ysl'), workspaceYsl, 'utf8');
  for (const content of restFiles) {
    const id = /id: "([^"]+)"/.exec(content)?.[1];
    assert.ok(id);
    await writeFile(join(restRoot, `${id}.ysl`), content, 'utf8');
  }
  for (const content of sseFiles) {
    const id = /id: "([^"]+)"/.exec(content)?.[1];
    assert.ok(id);
    await writeFile(join(sseRoot, `${id}.ysl`), content, 'utf8');
  }
}

async function createTestDatabase(): Promise<HeadlessDrizzleDatabase> {
  const database = drizzle(':memory:', { schema });
  for (const migrationName of migrationNames) {
    const url = new URL(`../../../../drizzle/${migrationName}`, import.meta.url);
    const migration = await Deno.readTextFile(url);
    for (const statement of migration.split('--> statement-breakpoint')) {
      if (statement.trim()) database.$client.exec(statement);
    }
  }
  database.$client.exec('PRAGMA foreign_keys = ON');
  return database;
}

function statusFor(report: Awaited<ReturnType<GuiWorkspaceReconciler['reconcile']>>, entityId: string) {
  return report.entries.find((entry) => entry.entityId === entityId)?.status;
}

function revisionIds(database: HeadlessDrizzleDatabase): string[] {
  return database
    .select()
    .from(sourceRevisions)
    .all()
    .map((row) => row.entityId)
    .sort();
}

function revision(database: HeadlessDrizzleDatabase, entityId: string) {
  return structuredClone(
    database
      .select()
      .from(sourceRevisions)
      .all()
      .find((row) => row.entityId === entityId),
  );
}

const workspaceYsl = `@workspace
metadata {
  id: "workspace"
  name: "Workspace"
  version: 1
}
snapshot 1
groups {}
script null
`;

function restYsl(id: string, name: string): string {
  return `@rest
metadata {
  name: "${name}"
  method: "GET"
  id: "${id}"
  groupId: null
}
request {
  url: "https://source.example/${id}"
  headers: []
  parameters: []
  searchParameters: []
  body: null
}
dependencies []
script null
test null
`;
}

function sseYsl(id: string, name: string, method: string, events: string[], retryMs: number): string {
  return `@sse
metadata {
  name: "${name}"
  method: "${method}"
  id: "${id}"
  groupId: null
}
request {
  url: "https://source.example/${id}"
  headers: [{ key: "x-source" value: "ysl" enabled: true }]
  parameters: []
  searchParameters: [{ key: "topic" value: "events" enabled: true }]
  body: { type: "json" content: "{\\"subscribe\\":true}" }
}
events [${events.map((event) => JSON.stringify(event)).join(', ')}]
reconnect { enabled: true retryMs: ${retryMs} }
dependencies []
script { export function onResponse(ctx) { console.log(ctx.res.status); } }
test { export function onTest() { test("events", () => expect(true).toBe(true)); } }
`;
}
