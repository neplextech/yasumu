# Headless architecture

This document is the contributor reference for Yasumu's shared
workspace and execution architecture. User-facing script and CLI
documentation lives in `apps/docs`.

## Dependency direction

```text
schema ───────────────┐
                     ├─> headless <─ persistence/transport/file/email adapters
runtime-api ──────────┘       │
       ▲                      │
       ├─ runtime-node <──────┤ CLI assembly
       └─ Tanxium adapter <───┤ desktop RPC assembly
```

- `packages/schema` owns canonical YSL definitions, parsing,
  diagnostics, and public schema exports.
- `packages/runtime-api` owns the script-facing types and serializable
  worker protocol. It contains no executable host policy.
- `packages/headless` owns normalized workspaces, CRUD rules,
  interpolation, request building, execution orchestration, events,
  reconciliation, email lifecycle, and ports.
- `packages/runtime-node` implements the runtime contract with
  persistent Node worker threads and runtime-controlled loader hooks.
- `packages/tanxium/src/headless/runtime` adapts the Tanxium worker to
  the same contract.
- `packages/cli` supplies filesystem, terminal, process environment,
  signal, and Node-runtime adapters.
- `packages/tanxium/src/headless` supplies SQLite/Drizzle, desktop
  file, echo-aware transport, email, execution-event, history, native
  permission, and Tanxium adapters.
- `packages/rpc` and `packages/core` expose the desktop `execution`
  action and event subscription without duplicating domain behavior.

The headless package must not import React, Tauri, SQLite, Drizzle,
Node worker threads, Deno, Bun, or terminal presentation.

## Canonical execution

`HeadlessExecutionService.execute()` accepts a serializable entity
input plus an optional host-local `AbortSignal` and performs:

1. workspace/entity lookup
2. environment and secret resolution
3. typed interpolation and file resolution
4. Web `Request` construction
5. runtime session creation
6. workspace, group-lineage, and entity `onRequest` hooks
7. mock selection or transport
8. the same `onResponse` cascade
9. `onTest` cascade in test mode
10. redaction, snapshots, history, events, and cleanup

REST and GraphQL specialize request construction only. The result
contains no live `Request`, `Response`, `File`, worker, database, or
Tauri object.

Nested execution calls the same service recursively. It inherits the
current environment and cancellation signal, records parent/root
identity, emits child events, and enforces `maxNestingDepth`.

## Ports

External behavior is split across focused interfaces:

- `WorkspaceRepository`
- `EntityRepository`
- `SecretProvider`
- `FileResolver`
- `RequestTransport`
- `EmailProvider`
- `PermissionProvider`
- `ExecutionEventSink`
- `ExecutionHistoryRepository`
- `Clock`
- `IdGenerator`
- `WorkspaceSource`
- `SourceSnapshotStore`

Tests should use in-memory or recording adapters. Hosts should compose
the small ports and must not introduce a catch-all platform interface.

## Script contract

The neutral manifest is
`packages/runtime-api/contract/runtime-api.json`. The deterministic
generator writes:

- `packages/runtime-api/src/generated.ts`
- `crates/tanxium/src/generated_runtime_contract.rs`
- `crates/tanxium/src/runtime/generated-runtime-contract.ts`

Run:

```sh
pnpm --filter @yasumu/runtime-api generate
pnpm --filter @yasumu/runtime-api check:generated
```

Editor declarations are generated from the runtime API rather than
maintained as another contract. Runtime-specific behavior remains
explicit; the manifest generates names and protocol glue, not
arbitrary executable Rust.

Each adapter implements `YasumuScriptRuntime.createSession()` and a
session with `invokeHook()` and `dispose()`. Typed host calls cover
entity lookup and execution, email candidates, files, and permissions.
Runtime capabilities are declared, not inferred.

Inside a runtime, scripts receive standard Web objects. Across process
and worker boundaries, adapters use `RequestSnapshot`,
`ResponseSnapshot`, `WorkspaceEmail`, `YasumuFileReference`,
structured errors, logs, tests, and diagnostics.

## Virtual modules

The generated module list is:

- `yasumu:test`
- `yasumu:workspace`
- `yasumu:runtime`
- `yasumu:env`
- `yasumu:files`

The Node adapter resolves them with controlled module hooks. Tanxium
resolves them through its module loader and registered virtual
modules. Workspace code is session-scoped and cannot leak into another
workspace.

## Persistence and YSL reconciliation

The CLI treats `$cwd/yasumu` as its canonical source. It sorts paths,
content-hash caches parsed files, validates every file, and refuses to
return a workspace when any error diagnostic exists.

The desktop treats SQLite as active application state. The Drizzle
adapters persist stable source origin, execution history, and source
revisions. Reconciliation compares:

```text
base = last imported normalized source
source = current normalized YSL
database = current normalized SQLite entity
```

Equal revisions are unchanged. A unilateral edit wins automatically.
Object fields edited independently are merged. A same-field edit or
edit/delete race returns `conflict` with field paths and all three
values. Conflict results do not mutate either side. Successful imports
update the stored source and database snapshots in one synchronized
operation.

Modification time and the legacy lock timestamp are never the sole
revision.

## Files

`YasumuFileReference` supports `workspace-path`, `host-handle`, and
`inline` sources. The CLI confines paths and symlink targets to the
workspace root. The desktop resolves host handles behind the RPC
boundary. Request snapshots are bounded and do not embed unbounded
binary bodies.

## Email lifecycle

The execution start timestamp is passed to the runtime. `awaitEmail`
first queries persisted candidates since that timestamp, evaluates
predicates in the worker, then subscribes for later candidates using a
cursor. Timeout and cancellation dispose the subscription. `onEmail`
uses `EmailHookContext` and the same workspace API.

## Permission behavior

The core emits a structured permission request through
`PermissionProvider`. The desktop adapter retains the blocking native
confirmation path required by Tanxium. CLI and future CI hosts may
preconfigure grants or deny capabilities.

## Adding a runtime

1. Depend on `@yasumu/runtime-api`, not host internals.
2. Implement runtime/session lifecycle and explicit capabilities.
3. Reconstruct Web objects from snapshots inside the isolated runtime.
4. Implement every generated virtual module and host method.
5. Isolate module state, environment mutations, and test context per
   session or execution as documented.
6. Propagate aborts/timeouts and dispose all resources.
7. Run the shared runtime conformance suite.

Do not copy request construction, interpolation, entity lookup, result
aggregation, or reconciliation into a runtime adapter.

## Validation

Focused commands:

```sh
pnpm --filter @yasumu/runtime-api check:generated
pnpm --filter @yasumu/headless test
pnpm --filter @yasumu/runtime-node test
pnpm --filter @yasumu/cli test
pnpm --filter @yasumu/tanxium test
pnpm --filter @yasumu/app test
pnpm --filter @yasumu/docs build
pnpm --filter www build
cargo fmt --all --check
cargo check --workspace
pnpm --filter @yasumu/tanxium-runtime-tests test
```

Parity tests should normalize timing and runtime identity, then
compare request, response, mock, hook order, tests, nested output,
diagnostics, errors, and cancellation behavior.
