import assert from "node:assert/strict";

import {
  type ExecutableEntity,
  WorkspaceCrudService,
  type YasumuWorkspace,
} from "@yasumu/headless";
import { eq } from "drizzle-orm";

import * as schema from "../../database/schema.ts";
import {
  emails,
  entityGroups,
  environments,
  executionHistory,
  smtp,
  sourceRevisions,
  workspaces,
} from "../../database/schema.ts";
import { drizzle } from "../../database/sqlite/index.ts";
import type { HeadlessDrizzleDatabase } from "./database.ts";
import { createDrizzleHeadlessPersistence } from "./index.ts";

declare global {
  var Yasumu: { cuid(): string };
}

let cuidSequence = 0;
Object.defineProperty(globalThis, "Yasumu", {
  configurable: true,
  value: { cuid: () => `test-cuid-${++cuidSequence}` },
  writable: true,
});

const migrationNames = [
  "0000_real_kulan_gath.sql",
  "0001_rare_pride.sql",
  "0002_breezy_unus.sql",
  "0003_late_kitty_pryde.sql",
  "0004_headless_persistence.sql",
];

Deno.test("workspace adapter maps complete aggregates without claiming source baseline ownership", async () => {
  const database = await createTestDatabase();
  try {
    const persistence = createDrizzleHeadlessPersistence(database);
    await persistence.workspaces.save(workspaceFixture());

    const loaded = await persistence.workspaces.get("workspace");
    assert.ok(loaded);
    assert.equal(loaded.root, "/workspace");
    assert.equal(loaded.script?.id, "workspace:workspace");
    assert.deepEqual(
      loaded.groups.map((group) => group.id),
      ["group-root", "group-child"],
    );
    assert.deepEqual(
      loaded.entities.map((entity) => `${entity.kind}:${entity.id}`),
      ["rest:rest-a", "rest:rest-b", "graphql:graphql-a"],
    );
    assert.deepEqual(loaded.entities[1]?.dependencies, ["rest-a"]);
    assert.equal(
      loaded.entities[1]?.scripts.test?.code,
      "export function onTest() {}",
    );
    assert.equal(loaded.environments[0]?.origin.kind, "sqlite");
    assert.equal(loaded.smtp?.script?.id, "smtp:smtp");

    const revisions = database.select().from(sourceRevisions).where(
      eq(sourceRevisions.workspaceId, "workspace"),
    ).all();
    assert.deepEqual(revisions, []);
  } finally {
    database.$client.close();
  }
});

Deno.test("entity adapter enforces stable IDs, references, deterministic listing, and CRUD", async () => {
  const database = await createTestDatabase();
  try {
    const persistence = createDrizzleHeadlessPersistence(database);
    const workspace = workspaceFixture();
    workspace.entities = [];
    await persistence.workspaces.save(workspace);

    const base = restEntity("rest-base");
    const child = restEntity("rest-child", ["rest-base"]);
    await persistence.entities.create("workspace", base);
    await persistence.entities.create("workspace", child);

    assert.deepEqual(
      (await persistence.entities.list("workspace")).map((entity) => entity.id),
      ["rest-base", "rest-child"],
    );
    await assert.rejects(
      () => persistence.entities.delete("workspace", "rest-base"),
      /still referenced/,
    );
    await assert.rejects(
      () =>
        persistence.entities.create("workspace", graphqlEntity("rest-base")),
      /already exists/,
    );
    await assert.rejects(
      () =>
        persistence.entities.update("workspace", "rest-child", {
          ...child,
          id: "renamed",
        }),
      /immutable/,
    );

    const updated = await persistence.entities.update(
      "workspace",
      "rest-child",
      {
        ...child,
        name: "Updated child",
        dependencies: [],
      },
    );
    assert.equal(updated.name, "Updated child");
    await persistence.entities.delete("workspace", "rest-base");
    assert.equal(
      await persistence.entities.get("workspace", "rest-base"),
      null,
    );
  } finally {
    database.$client.close();
  }
});

Deno.test("shared workspace CRUD deletes omitted environment, group, and SMTP rows", async () => {
  const database = await createTestDatabase();
  try {
    const persistence = createDrizzleHeadlessPersistence(database);
    await persistence.workspaces.save(workspaceFixture());
    const crud = new WorkspaceCrudService(persistence.workspaces);

    await crud.deleteEnvironment("workspace", "environment-a");
    await crud.deleteGroup("workspace", "group-child");
    await crud.setSmtp("workspace", undefined);

    assert.equal(
      database.select().from(environments).where(
        eq(environments.id, "environment-a"),
      ).get(),
      undefined,
    );
    assert.equal(
      database.select().from(entityGroups).where(
        eq(entityGroups.id, "group-child"),
      ).get(),
      undefined,
    );
    assert.equal(
      database.select().from(smtp).where(eq(smtp.workspaceId, "workspace"))
        .get(),
      undefined,
    );
    assert.equal(
      database.select().from(workspaces).where(eq(workspaces.id, "workspace"))
        .get()?.activeEnvironmentId,
      null,
    );
  } finally {
    database.$client.close();
  }
});

Deno.test("environment and email adapters use deterministic workspace-scoped persistence", async () => {
  const database = await createTestDatabase();
  try {
    const persistence = createDrizzleHeadlessPersistence(database);
    const workspace = workspaceFixture();
    workspace.environments = [];
    workspace.activeEnvironmentId = null;
    await persistence.workspaces.save(workspace);

    const environment = await persistence.environments.save({
      id: "environment-b",
      workspaceId: "workspace",
      name: "B",
      variables: [{ key: "host", value: "example.com", enabled: true }],
      secrets: [{ key: "token", value: "token", enabled: true }],
      origin: { kind: "sqlite" },
    });
    assert.equal(environment.variables[0]?.value, "example.com");
    await persistence.environments.setActive("workspace", environment.id);
    assert.equal(
      database.select().from(workspaces).where(eq(workspaces.id, "workspace"))
        .get()?.activeEnvironmentId,
      "environment-b",
    );

    database
      .insert(emails)
      .values([
        {
          id: "email-a",
          smtpId: "smtp",
          from: "from@example.com",
          to: "a@example.com, b@example.com",
          cc: "c@example.com",
          subject: "A",
          html: "<p>A</p>",
          text: "A",
          unread: true,
          createdAt: 10,
          updatedAt: 10,
        },
        {
          id: "email-b",
          smtpId: "smtp",
          from: "from@example.com",
          to: "b@example.com",
          cc: null,
          subject: "B",
          html: "<p>B</p>",
          text: "B",
          unread: false,
          createdAt: 20,
          updatedAt: 20,
        },
      ])
      .run();

    const listed = await persistence.email.list("workspace", { since: 10 });
    assert.deepEqual(
      listed.map((email) => email.id),
      ["email-a", "email-b"],
    );
    assert.deepEqual(listed[0]?.to, ["a@example.com", "b@example.com"]);

    const signal = new AbortController().signal;
    const first = await persistence.email.next("workspace", {
      since: 10,
      timeoutMs: 0,
    }, signal);
    assert.equal(first.email?.id, "email-a");
    const second = await persistence.email.next("workspace", {
      since: 10,
      cursor: first.cursor,
      timeoutMs: 0,
    }, signal);
    assert.equal(second.email?.id, "email-b");
    const done = await persistence.email.next("workspace", {
      since: 10,
      cursor: second.cursor,
      timeoutMs: 0,
    }, signal);
    assert.equal(done.email, null);
  } finally {
    database.$client.close();
  }
});

Deno.test("execution history adapter upserts terminal records with serialized tests", async () => {
  const database = await createTestDatabase();
  try {
    const persistence = createDrizzleHeadlessPersistence(database);
    await persistence.workspaces.save(workspaceFixture());
    await persistence.history.save({
      id: "execution",
      rootId: "execution",
      workspaceId: "workspace",
      entityId: "rest-a",
      entityKind: "rest",
      status: "completed",
      startedAt: 10,
      completedAt: 20,
      durationMs: 10,
      tests: [{ test: "status", result: "pass", error: null, duration: 1 }],
      result: { response: { status: 200 } },
    });
    await persistence.history.save({
      id: "execution",
      rootId: "execution",
      workspaceId: "workspace",
      entityId: "rest-a",
      entityKind: "rest",
      status: "failed",
      startedAt: 10,
      completedAt: 25,
      durationMs: 15,
      tests: [],
      result: { error: "failed" },
    });

    const rows = database.select().from(executionHistory).all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.status, "failed");
    assert.deepEqual(rows[0]?.result, {
      result: { error: "failed" },
      tests: [],
    });
  } finally {
    database.$client.close();
  }
});

async function createTestDatabase(): Promise<HeadlessDrizzleDatabase> {
  const database = drizzle(":memory:", { schema });
  for (const migrationName of migrationNames) {
    const url = new URL(`../../../drizzle/${migrationName}`, import.meta.url);
    const migration = await Deno.readTextFile(url);
    for (const statement of migration.split("--> statement-breakpoint")) {
      if (statement.trim()) database.$client.exec(statement);
    }
  }
  database.$client.exec("PRAGMA foreign_keys = ON");
  return database;
}

function workspaceFixture(): YasumuWorkspace {
  const workspaceOrigin = ysl("yasumu/workspace.ysl", "workspace-revision");
  return {
    id: "workspace",
    name: "Workspace",
    version: 1,
    root: "/workspace",
    activeEnvironmentId: "environment-a",
    script: { id: "workspace-source", code: "export const token = true" },
    groups: [
      {
        id: "group-child",
        name: "Child",
        workspaceId: "workspace",
        parentId: "group-root",
        entityKind: "rest",
        origin: workspaceOrigin,
      },
      {
        id: "group-root",
        name: "Root",
        workspaceId: "workspace",
        parentId: null,
        entityKind: "rest",
        script: { id: "group-source", code: "export const grouped = true" },
        origin: workspaceOrigin,
      },
    ],
    entities: [
      restEntity("rest-b", ["rest-a"]),
      graphqlEntity("graphql-a"),
      restEntity("rest-a"),
    ],
    environments: [
      {
        id: "environment-a",
        workspaceId: "workspace",
        name: "Local",
        variables: [{ key: "host", value: "localhost", enabled: true }],
        secrets: [{ key: "token", value: "secret-value", enabled: true }],
        origin: ysl(
          "yasumu/environment/environment-a.ysl",
          "environment-revision",
        ),
      },
    ],
    smtp: {
      id: "smtp",
      port: 1025,
      username: "smtp-user",
      password: "smtp-password",
      script: { id: "smtp-source", code: "export function onEmail() {}" },
      origin: ysl("yasumu/smtp.ysl", "smtp-revision"),
    },
    metadata: { sourceSnapshot: 0 },
    origin: workspaceOrigin,
  };
}

function restEntity(id: string, dependencies: string[] = []): ExecutableEntity {
  return {
    kind: "rest",
    id,
    name: id,
    workspaceId: "workspace",
    groupId: null,
    method: "GET",
    url: `https://example.com/${id}`,
    headers: [],
    pathParameters: [],
    searchParameters: [],
    body: null,
    scripts: {
      lifecycle: {
        id: `${id}-lifecycle`,
        code: "export function onRequest() {}",
      },
      test: id === "rest-b"
        ? { id: `${id}-test`, code: "export function onTest() {}" }
        : undefined,
    },
    dependencies,
    metadata: {},
    origin: ysl(`yasumu/rest/${id}.ysl`, `${id}-revision`),
  };
}

function graphqlEntity(id: string): ExecutableEntity {
  return {
    kind: "graphql",
    id,
    name: id,
    workspaceId: "workspace",
    groupId: null,
    url: "https://example.com/graphql",
    headers: [],
    pathParameters: [],
    searchParameters: [],
    body: {
      query: "query Test { test }",
      variables: "{}",
      operationName: "Test",
    },
    scripts: {},
    dependencies: [],
    metadata: {},
    origin: ysl(`yasumu/graphql/${id}.ysl`, `${id}-revision`),
  };
}

function ysl(path: string, revision: string) {
  return { kind: "ysl" as const, path, revision, importedRevision: revision };
}
