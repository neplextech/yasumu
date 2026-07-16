import assert from "node:assert/strict";
import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  type ExecutionEvent,
  HeadlessExecutionService,
  InMemoryEntityRepository,
  InMemoryWorkspaceRepository,
  type RequestTransport,
  type YasumuWorkspace,
} from "@yasumu/headless";
import type {
  CreateRuntimeSessionInput,
  InvokeHookOptions,
  RuntimeCapabilities,
  ScriptHookInvocation,
  ScriptHookResult,
  YasumuRuntimeSession,
  YasumuScriptRuntime,
} from "@yasumu/runtime-api";
import { eq } from "drizzle-orm";

import { NodeWorkspaceFileResolver } from "../../../../cli/src/filesystem.ts";
import * as schema from "../../database/schema.ts";
import { executionHistory } from "../../database/schema.ts";
import { drizzle } from "../../database/sqlite/index.ts";
import { migrate } from "../../database/sqlite/migrator.ts";
import { createGuiHeadlessExecutionPlatform } from "./assembly.ts";
import {
  getGuiEchoServerPort,
  GuiFetchTransport,
  rewriteGuiEchoUrl,
  setGuiEchoServerPort,
} from "./echo-transport.ts";
import { GuiExecutionEventSink } from "./event-sink.ts";
import {
  GuiFileResolver,
  InMemoryGuiFileHandleStore,
} from "./file-resolver.ts";
import {
  type GuiConfirmationDialog,
  GuiPermissionProvider,
} from "./permission-provider.ts";

declare global {
  var Yasumu: {
    cuid(): string;
    ui: { showConfirmationDialogSync(dialog: GuiConfirmationDialog): boolean };
  };
}

let cuidSequence = 0;
Object.defineProperty(globalThis, "Yasumu", {
  configurable: true,
  value: {
    cuid: () => `platform-cuid-${++cuidSequence}`,
    ui: { showConfirmationDialogSync: () => true },
  },
  writable: true,
});

Deno.test("GUI fetch transport rewrites only the embedded echo alias and rejects an unset port", async () => {
  const seen: Request[] = [];
  const transport = new GuiFetchTransport(
    () => 41_234,
    (input) => {
      seen.push(input instanceof Request ? input : new Request(input));
      return Promise.resolve(new Response("ok"));
    },
  );
  await transport.send(
    new Request("https://echo.yasumu.local/api/echo?value=one", {
      method: "POST",
      body: "body",
    }),
    transportContext(),
    new AbortController().signal,
  );
  assert.equal(seen[0]?.url, "http://127.0.0.1:41234/api/echo?value=one");
  assert.equal(await seen[0]?.text(), "body");
  assert.equal(
    rewriteGuiEchoUrl("https://example.com/path", null).href,
    "https://example.com/path",
  );
  assert.throws(
    () => rewriteGuiEchoUrl("http://echo.yasumu.local/path", null),
    /not available/,
  );

  assert.throws(
    () =>
      new GuiFetchTransport().send(
        new Request("http://echo.yasumu.local/path"),
        transportContext(),
        new AbortController().signal,
      ),
    /not available/,
  );
  setGuiEchoServerPort(45_678);
  assert.equal(getGuiEchoServerPort(), 45_678);
  setGuiEchoServerPort(null);
});

Deno.test("GUI file resolver supports serializable references and blocks traversal and symlink escapes", async () => {
  const base = await Deno.makeTempDir({ prefix: "yasumu-gui-files-" });
  try {
    const projectRoot = join(base, "workspace");
    const root = join(projectRoot, "yasumu");
    const outside = join(projectRoot, "outside");
    await Promise.all([
      mkdir(join(root, "fixtures"), { recursive: true }),
      mkdir(outside, { recursive: true }),
    ]);
    await Promise.all([
      writeFile(join(root, "fixtures", "inside.txt"), "inside"),
      writeFile(join(outside, "secret.txt"), "secret"),
    ]);
    await symlink(outside, join(root, "escape"));

    const workspace = workspaceFixture(projectRoot);
    const handles = new InMemoryGuiFileHandleStore();
    const hostReference = handles.register("selected", {
      name: "selected.json",
      mimeType: "application/json",
      bytes: [123, 125],
    });
    assert.deepEqual(JSON.parse(JSON.stringify(hostReference)), hostReference);
    assert.equal(JSON.stringify(hostReference).includes("123"), false);
    assert.deepEqual(hostReference.source, {
      type: "host-handle",
      handleId: "selected",
    });
    const resolver = new GuiFileResolver(handles);

    const workspaceFile = await resolver.open(
      workspace,
      {
        id: "inside",
        name: "inside.txt",
        source: { type: "workspace-path", path: "fixtures/inside.txt" },
      },
    );
    assert.equal(await workspaceFile.blob.text(), "inside");
    assert.equal(workspaceFile.file.mimeType, "text/plain");

    const cliWorkspace = workspaceFixture(root);
    const cliFile = await new NodeWorkspaceFileResolver().open(
      cliWorkspace,
      {
        id: "inside",
        name: "inside.txt",
        source: { type: "workspace-path", path: "fixtures/inside.txt" },
      },
    );
    assert.equal(workspaceFile.file.resolvedPath, cliFile.file.resolvedPath);
    assert.deepEqual(workspaceFile.file.source, cliFile.file.source);
    assert.equal(await cliFile.blob.text(), "inside");

    const hostFile = await resolver.open(workspace, hostReference);
    assert.equal(await hostFile.blob.text(), "{}");
    assert.equal(hostFile.file.size, 2);

    const inlineFile = await resolver.open(workspace, {
      id: "inline",
      name: "inline.txt",
      source: { type: "inline", bytes: [111, 107] },
    });
    assert.equal(await inlineFile.blob.text(), "ok");

    await assert.rejects(
      () => resolver.resolve(workspace, "../outside/secret.txt"),
      /escapes the workspace root/,
    );
    await assert.rejects(
      () => resolver.resolve(workspace, "escape/secret.txt"),
      /escapes the workspace root/,
    );
  } finally {
    await Deno.remove(base, { recursive: true });
  }
});

Deno.test("GUI permission and event adapters keep native decisions blocking and events observational", async () => {
  const dialogs: string[] = [];
  const permissions = new GuiPermissionProvider((dialog) => {
    dialogs.push(`${dialog.title}:${dialog.message}`);
    return true;
  });
  const granted = await permissions.request(
    {
      capability: "filesystemRead",
      executionId: "execution",
      reason: "Read a fixture",
      resource: "fixtures/input.json",
    },
    new AbortController().signal,
  );
  assert.equal(granted, true);
  assert.match(dialogs[0]!, /filesystem read/);
  assert.match(dialogs[0]!, /fixtures\/input.json/);

  const aborted = new AbortController();
  aborted.abort(new DOMException("Stopped", "AbortError"));
  await assert.rejects(
    () =>
      permissions.request(
        { capability: "network", executionId: "execution" },
        aborted.signal,
      ),
    /Stopped/,
  );

  const events: ExecutionEvent[] = [];
  const sink = new GuiExecutionEventSink((event) => {
    events.push(event);
  });
  await sink.emit(executionEvent("execution-started"));
  assert.equal(events[0]?.type, "execution-started");
});

Deno.test("GUI assembly executes through fake runtime, Drizzle ports, events, transport, and history", async () => {
  const database = drizzle(":memory:", { schema });
  await migrate(database, {
    migrationsFolder: fileURLToPath(
      new URL("../../../drizzle", import.meta.url),
    ),
  });
  try {
    const urls: string[] = [];
    const events: ExecutionEvent[] = [];
    const platform = createGuiHeadlessExecutionPlatform({
      database,
      runtime: new FakeRuntime(),
      echoServerPort: () => 32_100,
      fetch: (input) => {
        const request = input instanceof Request ? input : new Request(input);
        urls.push(request.url);
        return Promise.resolve(
          Response.json({ echoed: true }, {
            status: 201,
            headers: { "x-yasumu-test": "assembly" },
          }),
        );
      },
      publishExecutionEvent: (event) => {
        events.push(event);
      },
      confirmPermission: () => true,
    });
    await platform.persistence.workspaces.save(workspaceFixture("/workspace"));

    const result = await platform.execution.execute({
      executionId: "execution-gui",
      workspaceId: "workspace",
      entityId: "rest-echo",
      mode: "test",
    });

    assert.equal(result.status, "completed");
    assert.equal(result.response?.status, 201);
    assert.deepEqual(
      result.response?.body.kind === "json" ? result.response.body.value : null,
      { echoed: true },
    );
    assert.deepEqual(urls, ["http://127.0.0.1:32100/api/echo?source=gui"]);
    assert.deepEqual(
      events.filter((event) =>
        event.type === "execution-started" ||
        event.type === "execution-completed"
      ).map((event) => event.type),
      ["execution-started", "execution-completed"],
    );
    const history = database
      .select()
      .from(executionHistory)
      .where(eq(executionHistory.executionId, "execution-gui"))
      .get();
    assert.equal(history?.status, "completed");
    assert.equal(history?.workspaceId, "workspace");
  } finally {
    database.$client.close();
  }
});

Deno.test("GUI incoming email hooks use Tanxium sessions and shared workspace host APIs", async () => {
  const database = drizzle(":memory:", { schema });
  await migrate(database, {
    migrationsFolder: fileURLToPath(
      new URL("../../../drizzle", import.meta.url),
    ),
  });
  try {
    const runtime = new RecordingEmailRuntime();
    const platform = createGuiHeadlessExecutionPlatform({
      database,
      runtime,
      publishExecutionEvent: () => undefined,
    });
    const workspace = workspaceFixture("/workspace");
    workspace.script = {
      id: "workspace-email",
      code: "export function onEmail() {}",
    };
    workspace.smtp = {
      id: "smtp",
      port: 2525,
      script: {
        id: "smtp-email",
        code: "export function onEmail() {}",
      },
      origin: { kind: "sqlite" },
    };
    await platform.persistence.workspaces.save(workspace);

    const result = await platform.emailHooks.handle("workspace", {
      id: "email",
      from: "sender@example.test",
      to: ["receiver@example.test"],
      cc: [],
      subject: "Hello",
      html: "<p>Hello</p>",
      text: "Hello",
      createdAt: 10,
    });

    assert.equal(result.status, "completed");
    assert.deepEqual(
      runtime.invocations.map((invocation) => invocation.source.id),
      ["workspace:workspace", "smtp:smtp"],
    );
    assert.deepEqual(runtime.listedEntityIds, ["rest-echo", "rest-echo"]);
    assert.equal(runtime.invocations[0]?.email?.subject, "Hello");
  } finally {
    database.$client.close();
  }
});

Deno.test("desktop and in-memory CLI-style assemblies produce the same normalized execution result", async () => {
  const database = drizzle(":memory:", { schema });
  await migrate(database, {
    migrationsFolder: fileURLToPath(
      new URL("../../../drizzle", import.meta.url),
    ),
  });
  try {
    const fixture = workspaceFixture("/workspace");
    fixture.entities[0]!.url = "https://api.example.test/echo";
    const response = () =>
      Response.json({ parity: true }, {
        status: 202,
        headers: { "x-parity": "shared" },
      });

    const gui = createGuiHeadlessExecutionPlatform({
      database,
      runtime: new FakeRuntime(),
      fetch: () => Promise.resolve(response()),
      publishExecutionEvent: () => undefined,
    });
    await gui.persistence.workspaces.save(fixture);

    const memoryWorkspaces = new InMemoryWorkspaceRepository([fixture]);
    const memoryTransport: RequestTransport = {
      send: () => Promise.resolve(response()),
    };
    const cliStyle = new HeadlessExecutionService({
      workspaces: memoryWorkspaces,
      entities: new InMemoryEntityRepository(memoryWorkspaces),
      runtime: new FakeRuntime(),
      transport: memoryTransport,
    });

    const [guiResult, cliResult] = await Promise.all([
      gui.execution.execute({
        workspaceId: fixture.id,
        entityId: "rest-echo",
        executionId: "parity-execution",
        mode: "test",
      }),
      cliStyle.execute({
        workspaceId: fixture.id,
        entityId: "rest-echo",
        executionId: "parity-execution",
        mode: "test",
      }),
    ]);

    assert.deepEqual(
      normalizeExecution(guiResult),
      normalizeExecution(cliResult),
    );
  } finally {
    database.$client.close();
  }
});

class FakeRuntime implements YasumuScriptRuntime {
  readonly kind = "fake";
  readonly capabilities = {
    workers: false,
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
  } satisfies Readonly<RuntimeCapabilities>;

  public createSession(
    _input: CreateRuntimeSessionInput,
  ): Promise<YasumuRuntimeSession> {
    return Promise.resolve(new FakeRuntimeSession());
  }
}

class FakeRuntimeSession implements YasumuRuntimeSession {
  public invokeHook(
    invocation: ScriptHookInvocation,
    _options?: InvokeHookOptions,
  ): Promise<ScriptHookResult> {
    return Promise.resolve({
      environment: invocation.environment,
      tests: [],
      logs: [],
      diagnostics: [],
    });
  }

  public dispose(): Promise<void> {
    return Promise.resolve();
  }
}

class RecordingEmailRuntime extends FakeRuntime {
  readonly invocations: ScriptHookInvocation[] = [];
  readonly listedEntityIds: string[] = [];

  public override createSession(
    input: CreateRuntimeSessionInput,
  ): Promise<YasumuRuntimeSession> {
    return Promise.resolve({
      invokeHook: async (invocation, options) => {
        this.invocations.push(invocation);
        const signal = options?.signal ?? new AbortController().signal;
        const entities = await input.hostCall(
          "entity.list",
          { kind: "rest" },
          signal,
        );
        this.listedEntityIds.push(...entities.map((entity) => entity.id));
        return {
          environment: invocation.environment,
          tests: [],
          logs: [],
          diagnostics: [],
        };
      },
      dispose: () => Promise.resolve(),
    });
  }
}

function workspaceFixture(root: string): YasumuWorkspace {
  return {
    id: "workspace",
    name: "Workspace",
    version: 1,
    root,
    activeEnvironmentId: null,
    entities: [
      {
        kind: "rest",
        id: "rest-echo",
        name: "Echo",
        workspaceId: "workspace",
        groupId: null,
        method: "GET",
        url: "https://echo.yasumu.local/api/echo",
        headers: [],
        pathParameters: [],
        searchParameters: [{ key: "source", value: "gui", enabled: true }],
        body: null,
        scripts: {},
        dependencies: [],
        metadata: {},
        origin: { kind: "sqlite" },
      },
    ],
    groups: [],
    environments: [],
    metadata: {},
    origin: { kind: "sqlite" },
  };
}

function transportContext() {
  const workspace = workspaceFixture("/workspace");
  return {
    workspace,
    entity: workspace.entities[0]!,
    executionId: "execution",
  };
}

function executionEvent(
  type: "execution-started",
): Extract<ExecutionEvent, { type: "execution-started" }> {
  return {
    type,
    executionId: "execution",
    workspaceId: "workspace",
    entityId: "entity",
    timestamp: 1,
    mode: "run",
  };
}

function normalizeExecution<
  T extends {
    startedAt: number;
    completedAt: number;
    durationMs: number;
  },
>(result: T) {
  const {
    startedAt: _startedAt,
    completedAt: _completedAt,
    durationMs: _durationMs,
    ...stable
  } = result;
  return stable;
}
