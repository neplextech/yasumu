# Yasumu Headless Runtime Extraction and Unified Execution Architecture

You are responsible for designing and implementing a new headless
architecture for Yasumu.

The objective is to extract request execution, scripting, workspace
operations, environment handling, variable interpolation, entity
management, test execution, and related domain logic from:

- `./packages/tanxium`
- `./apps/yasumu/src`

into reusable headless packages that can be assembled by:

- `./packages/cli`
- `./apps/yasumu/src`
- `./packages/tanxium`
- future Node.js, Bun, Deno, server, CI, and automation integrations

The CLI and GUI must ultimately use the same domain logic, execution
pipeline, scripting API, validation rules, and behavioral semantics.

The implementation is the primary deliverable. Do not return only an
architecture proposal.

---

# 1. Core objective

Create a runtime-agnostic Yasumu headless system that becomes the
single source of truth for:

- workspace loading
- `.ysl` parsing and validation
- REST entity CRUD
- GraphQL entity CRUD
- script entity handling
- environment configuration
- variable interpolation
- secret resolution
- request construction
- request execution
- response processing
- script lifecycle hooks
- test execution
- request chaining
- GraphQL execution
- email waiting and querying
- file uploads
- multipart form data
- execution cancellation
- execution events
- execution diagnostics
- persistence reconciliation
- CLI execution
- GUI execution

The architecture must separate:

1. Yasumu domain behavior
2. JavaScript runtime integration
3. persistence
4. transport
5. application UI
6. CLI presentation

Tanxium must become only one JavaScript runtime adapter used by the
Tauri GUI.

Node.js, Bun, Deno, and future runtimes must be able to execute the
same Yasumu scripts by implementing a common runtime adapter contract.

---

# 2. Desired architecture

The final architecture should conceptually resemble:

```txt
packages/
  schema/
    Yasumu DSL definitions and validation

  headless/
    domain/
    workspace/
    entities/
    execution/
    scripting/
    testing/
    environments/
    interpolation/
    files/
    email/
    events/
    diagnostics/

  runtime-api/
    public script API definitions
    runtime protocol
    virtual module definitions
    generated runtime bindings

  runtime-node/
    Node.js worker runtime adapter
    Node.js loader hooks
    yasumu: virtual modules

  runtime-deno/
    optional or future adapter boundary

  runtime-bun/
    optional or future adapter boundary

  tanxium/
    Tanxium runtime adapter
    generated bootstrap bindings
    Tauri-specific integration only

  cli/
    filesystem workspace adapter
    terminal output
    CLI commands

apps/
  yasumu/
    SQLite persistence adapter
    .ysl reconciliation
    UI
    Tauri bindings
    headless core assembly
```

This structure is illustrative. Inspect the repository and choose
names and package boundaries that fit the existing monorepo
conventions.

Do not blindly create packages matching this example if a better
structure already exists.

---

# 3. Operating mode

Work autonomously from exploration through implementation.

You must:

1. inspect the existing implementation
2. document existing behavior internally
3. identify implicit contracts
4. define the target architecture
5. implement the headless system
6. implement at least one non-Tanxium runtime adapter
7. migrate the CLI to the headless system
8. migrate the GUI execution path to the headless system
9. preserve existing supported behavior
10. add parity and integration tests
11. validate builds and tests
12. remove or deprecate duplicated execution paths

Do not ask for approval between phases unless a truly blocking product
decision cannot be inferred from existing code, tests, schema, or UI
behavior.

When behavior is ambiguous:

1. inspect existing code
2. inspect tests
3. inspect the `.ysl` schema
4. inspect sample workspaces
5. preserve current observable behavior where reasonable
6. choose the simplest predictable semantic
7. document the decision in code or architecture notes

---

# 4. Mandatory exploration

Before making architectural changes, inspect the following areas.

## 4.1 Repository structure

Inspect:

- root package manager configuration
- workspace configuration
- build tooling
- TypeScript configuration
- Rust workspace configuration
- task runner configuration
- test configuration
- lint configuration
- package dependency graph

## 4.2 Existing Yasumu implementation

Inspect all relevant code under:

- `./apps/yasumu/src`
- `./packages/tanxium`
- `./packages/cli`
- `./packages/schema`
- `./crates/tanxium`
- `./test-workspace/yasumu`

Search for all implementations related to:

- request execution
- GraphQL execution
- request CRUD
- script execution
- worker creation
- virtual modules
- module resolution
- `yasumu:` imports
- request hooks
- response hooks
- test hooks
- variable interpolation
- environment variables
- secrets
- form data
- file uploads
- cancellation
- email handling
- SMTP integration
- workspace state
- workspace persistence
- SQLite
- Drizzle
- entity IDs
- request chaining
- execution history
- console output
- diagnostics
- permission prompts
- runtime permissions
- request mocks
- response mocks
- tests
- `describe`
- `test`
- `expect`

Do not assume the current architecture based only on filenames. Trace
the actual execution paths from UI or CLI entry point to network
execution and script lifecycle completion.

## 4.3 Behavioral inventory

Create an internal behavioral inventory describing:

- supported REST fields
- supported GraphQL fields
- supported script hooks
- hook ordering
- interpolation syntax
- environment precedence
- secret behavior
- request mutation rules
- response mutation rules
- mock behavior
- test registration and execution
- email waiting behavior
- file resolution behavior
- cancellation behavior
- timeout behavior
- error propagation
- execution events
- CLI output semantics
- GUI output semantics

This inventory must guide the migration.

---

# 5. Architectural principles

## 5.1 Single execution pipeline

There must be one canonical execution pipeline shared by CLI and GUI.

The pipeline should conceptually follow:

```txt
load entity
  -> resolve workspace
  -> resolve environment
  -> resolve secrets
  -> interpolate variables
  -> resolve body and files
  -> construct Web Request
  -> create execution lifecycle
  -> start script runtime (scripts will run in a cascaded lifecycle, i.e. entity group aka folders can define their own onRequest/onResponse/onTest hooks etc. The execution will cascade through the hierarchy of hooks, starting from the workspace-level hooks down to the entity-level hooks)
  -> call onRequest
  -> apply request mutation
  -> check cancellation
  -> use mocked Response or perform transport request
  -> call onResponse
  -> call onTest when enabled
  -> collect diagnostics, logs, test results, and metadata
  -> finalize execution
```

REST and GraphQL should share as much infrastructure as possible.

GraphQL execution may specialize request construction but must not
create an unrelated execution architecture.

## 5.2 Runtime-agnostic domain layer

The headless domain layer must not directly depend on:

- Tauri
- React
- SQLite
- Drizzle
- Node.js worker threads
- Deno workers
- Bun workers
- Tanxium internals
- terminal formatting
- browser-only APIs not available through adapters

It may depend on standard Web APIs where practical:

- `Request`
- `Response`
- `Headers`
- `URL`
- `AbortController`
- `ReadableStream`
- `Blob`
- `FormData`

Where Web API behavior differs across runtimes, normalize it inside
runtime or platform adapters.

## 5.3 Dependency inversion

External behavior must be supplied through explicit ports or adapters.

Examples include:

```ts
interface WorkspaceRepository {}
interface EntityRepository {}
interface SecretProvider {}
interface EnvironmentProvider {}
interface FileResolver {}
interface RequestTransport {}
interface ScriptRuntime {}
interface EmailProvider {}
interface ExecutionEventSink {}
interface ExecutionHistoryRepository {}
interface Clock {}
interface IdGenerator {}
```

Do not create one giant adapter interface.

Use small cohesive interfaces with clear ownership.

## 5.4 No GUI-specific domain assumptions

The core must not require:

- UI stores
- React hooks
- Zustand stores
- Tauri commands
- UI notifications
- modal dialogs
- GUI-specific file handles

GUI concerns should subscribe to headless events and provide adapters.

## 5.5 No CLI-specific domain assumptions

The core must not write directly to:

- stdout
- stderr
- terminal spinners
- process exit codes

The CLI should translate structured execution results and events into
terminal output.

---

# 6. Headless workspace model

Implement a canonical workspace model that can be loaded from
different sources.

The headless core should work with a normalized workspace
representation regardless of whether the source is:

- `.ysl` files
- SQLite
- in-memory test fixtures
- a future remote workspace service

The normalized model should include, as applicable:

```ts
interface YasumuWorkspace {
  id: string;
  name: string;
  root?: string;
  entities: YasumuEntity[];
  environments: WorkspaceEnvironment[];
  metadata?: WorkspaceMetadata;
}
```

Use the schema package as the authoritative definition where possible.

Avoid maintaining separate incompatible types in the CLI, GUI, schema
package, and runtime.

---

# 7. `.ysl` workspace behavior

Yasumu workspace files use the `.ysl` format powered by
`packages/schema`.

## 7.1 CLI workspace loading

The CLI must load workspace files from:

```txt
$cwd/yasumu
```

The sample workspace is located at:

```txt
test-workspace/yasumu
```

The loader must:

- discover supported `.ysl` files
- parse files through the schema package
- validate every entity
- produce useful diagnostics containing file path and source location
- preserve stable entity identity
- detect duplicate IDs
- detect invalid references
- resolve workspace-level configuration
- load environment definitions
- resolve file references relative to the correct workspace or entity
  file
- avoid nondeterministic file ordering
- support incremental loading where practical

The CLI must fail predictably when the workspace is invalid.

Do not silently skip invalid files.

## 7.2 GUI workspace persistence

The GUI reads canonical application state from its internal SQLite
database using Drizzle.

It must also reconcile changes from `.ysl` files.

Implement a reconciliation system that:

- detects new `.ysl` entities
- detects modified `.ysl` entities
- detects deleted `.ysl` entities
- minimizes destructive overwrites
- preserves stable IDs
- tracks source origin
- tracks last imported source revision or content hash
- detects when both the database and source file changed
- resolves safe changes automatically
- surfaces real conflicts explicitly
- avoids duplicating imported entities
- avoids rewriting unrelated records
- can be run incrementally
- remains efficient for large workspaces

Prefer a three-way reconciliation model:

```txt
last imported source state
current source file state
current database state
```

Possible reconciliation states should include:

```ts
type ReconciliationStatus =
  | 'unchanged'
  | 'source-added'
  | 'source-updated'
  | 'source-deleted'
  | 'database-updated'
  | 'auto-merged'
  | 'conflict';
```

Do not use file modification time as the only source of truth.

Use stable hashes or revisions.

Keep the reconciliation engine headless and independent from UI
presentation.

The GUI may provide a conflict resolution interface later, but the
reconciliation engine must expose structured conflicts now.

---

# 8. Entity CRUD

Implement headless CRUD services for all supported Yasumu entity
types.

At minimum:

- REST
- GraphQL
- scripts
- environments
- workspace-level scripts or configuration if currently supported

CRUD services must:

- validate through the schema layer
- preserve stable IDs
- enforce reference integrity
- expose structured errors
- avoid persistence-specific logic
- work with filesystem, SQLite, and in-memory repositories
- be usable by CLI tooling and GUI commands
- emit domain events where appropriate

Do not embed CRUD behavior separately in React components and CLI
commands.

---

# 9. Unified execution model

Define explicit execution inputs and outputs.

For example:

```ts
interface ExecuteEntityInput {
  workspaceId: string;
  entityId: string;
  environmentId?: string;
  mode?: 'run' | 'test';
  variables?: Record<string, unknown>;
  secrets?: Record<string, string>;
  signal?: AbortSignal;
  options?: ExecutionOptions;
}

interface ExecutionOptions {
  timeoutMs?: number;
  includeResponseBody?: boolean;
  followRedirects?: boolean;
}

interface ExecutionResult {
  executionId: string;
  entityId: string;
  request: RequestSnapshot;
  response?: ResponseSnapshot;
  isMockResponse: boolean;
  status: 'completed' | 'cancelled' | 'failed';
  startedAt: number;
  completedAt: number;
  durationMs: number;
  tests: TestResult[];
  logs: RuntimeLog[];
  diagnostics: Diagnostic[];
  error?: SerializedExecutionError;
}
```

Do not require these exact names. Use types that match the repository.

The execution result must be serializable.

Raw `Request` and `Response` objects may be used during execution, but
results crossing process, worker, Tauri, or persistence boundaries
need explicit serializable representations.

---

# 10. Web Request and Response semantics

Scripts should use standard Web API objects.

## 10.1 Request object

`ctx.req` must be a Web `Request`.

Scripts should be able to:

- inspect URL
- inspect method
- inspect headers
- clone the request
- read the body through normal Web APIs
- pass the request to frameworks such as:

```ts
await honoApp.fetch(ctx.req);
```

The execution pipeline must account for the one-shot nature of request
bodies.

Clone or snapshot requests where needed so that:

- `onRequest` can inspect the body
- transport can still send the body
- later hooks can still inspect request metadata
- tests can inspect the request

Do not accidentally consume the request body before transport.

## 10.2 Request modification

Define a predictable request modification model.

Possible approaches include:

1. allow reassignment through a context API
2. allow `onRequest` to return a new `Request`
3. expose explicit request mutation helpers
4. rebuild the request after script modifications

Choose one coherent model.

A recommended shape is:

```ts
export async function onRequest(ctx: RequestHookContext) {
  ctx.req = new Request(ctx.req, {
    headers: {
      ...Object.fromEntries(ctx.req.headers),
      authorization: 'Bearer token',
    },
  });
}
```

However, if direct assignment complicates cross-runtime serialization,
define an explicit API such as:

```ts
ctx.setRequest(new Request(...));
```

The final semantics must be documented and tested.

## 10.3 Request mocking

`onRequest` may return a Web `Response`:

```ts
export async function onRequest(ctx) {
  return new Response(JSON.stringify({ mocked: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
  });
}
```

Returning a `Response` must:

- bypass the external network request
- set `ctx.isMockResponse` to `true`
- still execute `onResponse`
- still execute `onTest` in test mode
- produce the same response result format as real responses
- preserve predictable lifecycle events

## 10.4 Response object

`ctx.res` must be a Web `Response`.

Within `onResponse`, the response is logically read-only.

Scripts may:

- inspect status
- inspect headers
- clone the response
- read cloned response bodies
- use response data for tests
- use response data for chained execution

Scripts must not replace the final response in `onResponse`.

Enforce this contract structurally where practical.

---

# 11. Script lifecycle API

The scripting API must be more robust, typed, and predictable.

Support at minimum:

```ts
export async function onRequest(ctx) {}

export async function onResponse(ctx) {}

export async function onTest(ctx) {}
```

## 11.1 Base context

All hook contexts should include:

```ts
interface BaseScriptContext<TEntity = YasumuEntity> {
  id: string;
  entity: TEntity;
  workspace: ScriptWorkspace;
  execution: ScriptExecutionInfo;
  signal: AbortSignal;
  cancel(reason?: string): void;
}
```

`ctx.id` is shorthand for:

```ts
ctx.entity.id;
```

## 11.2 Request context

```ts
interface RequestHookContext extends BaseScriptContext {
  req: Request;
}
```

## 11.3 Response context

```ts
interface ResponseHookContext extends BaseScriptContext {
  readonly req: Request;
  readonly res: Response;
  readonly isMockResponse: boolean;
}
```

## 11.4 Test context

```ts
interface TestHookContext extends ResponseHookContext {
  readonly isTest: true;
}
```

`onTest` should only run in test mode.

`describe`, `test`, and `expect` must only be available inside the
active asynchronous `onTest` AsyncLocalStorage context. Calling
`describe`/`test`/`expect` outside of that context will be no-op.

Preserve the current test behavior unless the existing behavior is
incorrect or nondeterministic.

---

# 12. Workspace scripting API

Expose a cohesive workspace API through:

```ts
ctx.workspace;
```

It should include workspace metadata and services relevant to scripts.

A target design may resemble:

```ts
interface ScriptWorkspace {
  readonly id: string;
  readonly name: string;
  readonly root?: string;

  readonly rest: RestExecutionAPI; // each entity execution api has methods like execute, get, find, list, etc.
  readonly graphql: GraphQLExecutionAPI;
  readonly email: EmailScriptAPI;
  readonly env: EnvironmentScriptAPI;
  readonly files: ScriptFileAPI;
}
```

Only expose capabilities that are safe, useful, and implementable
across runtimes.

Avoid exposing internal repositories or persistence models.

---

# 13. Request chaining

Scripts must be able to execute other workspace entities.

Example:

```ts
const result = await ctx.workspace.rest.execute('rest-entity-id', {
  withResponse: true,
});
```

REST scripts must be able to invoke GraphQL entities and GraphQL
scripts must be able to invoke REST entities.

Example:

```ts
const user = await ctx.workspace.graphql.execute('get-current-user', {
  variables: {
    id: '123',
  },
  withResponse: true,
});
```

Define clear execution options.

For example:

```ts
interface NestedExecutionOptions {
  environmentId?: string;
  variables?: Record<string, unknown>;
  withResponse?: boolean;
  runTests?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}
```

The default for `withResponse` should be `false` unless repository
behavior requires otherwise.

Clarify what the method returns when `withResponse` is false.

For example:

```ts
type NestedExecutionResult<TWithResponse extends boolean> =
  TWithResponse extends true
    ? FullNestedExecutionResult
    : NestedExecutionSummary;
```

Nested execution must:

- reuse the current workspace
- inherit the current environment by default
- inherit cancellation
- create a child execution ID
- preserve parent-child relationships
- avoid infinite recursion
- enforce configurable maximum nesting depth
- collect nested logs and diagnostics
- remain observable by GUI and CLI
- avoid deadlocks when scripts use workers

---

# 14. Email scripting API

Support inline waiting for incoming email.

Example:

```ts
export async function onResponse(ctx) {
  const mail = await ctx.workspace.email.awaitEmail((email) => {
    return email.to.includes('user@example.com');
  });
}
```

The email API must support the execution lifecycle window.

An email received after the request started but before `onResponse`
calls `awaitEmail` must still be discoverable.

The implementation should:

- record the execution start timestamp
- query buffered or persisted emails received since that timestamp
- apply the predicate to already received emails first
- subscribe for future matching emails if no existing match is found
- support timeout
- support cancellation through `AbortSignal`
- clean up subscriptions
- avoid races between query and subscription
- allow `onTest` to access the matched email
- support multiple email waits predictably

Possible API:

```ts
interface EmailScriptAPI {
  awaitEmail(
    predicate: EmailPredicate,
    options?: AwaitEmailOptions,
  ): Promise<WorkspaceEmail>;

  list(options?: EmailQueryOptions): Promise<WorkspaceEmail[]>;
}
```

Possible options:

```ts
interface AwaitEmailOptions {
  timeoutMs?: number;
  since?: Date | number;
  signal?: AbortSignal;
}
```

Predicates crossing worker boundaries may not be directly
serializable.

Design a safe runtime protocol.

Possible solutions include:

- execute the predicate inside the script worker against serialized
  email data
- stream candidate emails into the worker
- define structured filters for optimized common cases
- combine structured filters with worker-side predicates

Do not use `eval` in the host process.

Emails also have a dedicated script that listens to `onEmail(ctx)`
hook.

```ts
export async function onEmail(ctx: EmailHookContext) {
  const workspace = ctx.workspace // access workspace API and stuff just like onRequest/onResponse's ctx object
  // instead of `ctx.req` or `ctx.res`, `onEmail` exposes` ctx.email` which is a structured representation of the received email

  const email = ctx.email; // structured representation of the received & parsed email from smtp-server
```

---

# 15. Environment and secret API

`ctx.workspace.env` represents the active workspace environment.

Support environments such as:

- development
- staging
- nightly
- production
- custom user-defined environments

The API should provide clear access to variables and secrets.

Possible shape:

```ts
interface EnvironmentScriptAPI {
  readonly id?: string;
  readonly name?: string;

  getVariable(name: string): unknown;
  getSecret(name: string): string | undefined;

  getAllVariables(): Readonly<Record<string, unknown>>;
  getAllSecrets(): Readonly<Record<string, string>>;

  setVariable(name: string, value: unknown): void;
  setSecret(name: string, value: string): void;

  hasVariable(name: string): boolean;
  hasSecret(name: string): boolean;
}
```

Decide whether script mutations persist or only exist for the current
execution.

The safer default is:

- getters read the effective environment
- setters modify execution-scoped environment state
- persistence requires a separate explicit host capability

Do not allow scripts to silently persist secrets to disk or SQLite.

## 15.1 Headless secret sources

In CLI and headless mode:

- non-secret variables may come from `.ysl`
- secrets must be supplied explicitly
- secrets may come from `.env`
- secrets may come from process environment variables
- secrets may be passed through CLI flags or programmatic options
- source precedence must be explicit and deterministic

Define and test precedence.

A reasonable precedence is:

```txt
explicit execution values
  > CLI-provided values
  > process environment
  > selected .env file
  > workspace non-secret defaults
```

Do not expose secrets in:

- logs
- diagnostics
- snapshots
- test output
- execution history
- error messages

Implement secret redaction centrally.

---

# 16. Variable interpolation

Extract variable interpolation into the headless core.

It must work consistently in CLI and GUI for:

- URLs
- headers
- query parameters
- GraphQL variables
- request bodies
- form fields
- file paths where appropriate
- script configuration
- environment values where appropriate

Define:

- interpolation syntax
- escaping rules
- missing variable behavior
- null behavior
- non-string value behavior
- recursive interpolation rules
- maximum recursion depth
- cycle detection
- secret redaction
- type preservation

Avoid converting every interpolated value to a string when the target
supports typed values.

For example, GraphQL variables and JSON bodies should preserve
boolean, number, null, array, and object values where the whole value
is a variable reference.

Add focused tests for interpolation edge cases.

---

# 17. File uploads and form data

Both GUI and headless execution must fully support:

- `FormData`
- multipart requests
- text form fields
- repeated fields
- binary uploads
- multiple files
- file names
- MIME types
- empty files
- large files
- file references from `.ysl`
- files selected through GUI
- files referenced through CLI workspace paths

Do not require transferring entire file contents repeatedly between
workers if avoidable.

Create a runtime-independent file reference model.

For example:

```ts
interface YasumuFileReference {
  id: string;
  name: string;
  mimeType?: string;
  size?: number;
  source:
    | {
        type: 'workspace-path';
        path: string;
      }
    | {
        type: 'host-handle';
        handleId: string;
      }
    | {
        type: 'inline';
        data: Uint8Array;
      };
}
```

The exact structure may differ.

Important requirements:

- script workers can inspect attachment metadata
- scripts can identify which files are attached
- scripts can intentionally attach workspace files
- the host controls actual file access
- large files should not be copied through multiple serialization
  boundaries without reason
- path traversal outside allowed roots must be prevented
- GUI file handles must be resolved through a host adapter
- CLI file paths must be resolved relative to deterministic roots
- cancellation must stop file streaming where possible
- MIME type inference must be deterministic
- multipart boundaries must be generated correctly
- request snapshots must not embed huge binary payloads

Expose script APIs such as:

```ts
ctx.workspace.files.resolve('fixtures/avatar.png');
```

or:

```ts
const file = await ctx.workspace.files.open('fixtures/avatar.png');

const body = new FormData();
body.set('avatar', file);
```

Choose semantics that can work across Node.js, Bun, Deno, and Tanxium.

---

# 18. Runtime API package

Create a runtime API package containing the canonical script-facing
contracts.

This package should define:

- hook context types
- workspace API types
- execution API types
- environment API types
- file API types
- email API types
- test API types
- virtual module declarations
- runtime protocol messages
- serialization contracts
- runtime capability definitions

There must not be manually duplicated API definitions between
TypeScript and Rust.

The same API contract must drive:

- TypeScript types
- editor declarations
- virtual module definitions
- runtime protocol validation
- Tanxium bootstrap exposure
- Node runtime exposure
- future Deno and Bun exposure

---

# 19. Cross-runtime API generation

The Yasumu scripting API must remain synchronized across TypeScript
and Tanxium.

Implement a code-generation or schema-driven system.

Possible strategies include:

- JSON Schema
- TypeScript AST generation
- a declarative API manifest
- TypeScript definitions plus generated Rust protocol types
- Rust definitions plus generated TypeScript bindings
- a neutral interface definition format

Select the approach that best fits the existing repository.

The generator should produce or validate:

- script context types
- virtual module declarations
- serialized protocol types
- runtime method names
- runtime capability metadata
- Tanxium bootstrap bindings
- runtime version metadata

Generation must be deterministic.

Generated files must clearly indicate that they are generated.

CI or tests must fail when generated output is stale.

Do not attempt to generate executable Rust behavior from arbitrary
TypeScript.

Generate contracts and binding glue while keeping runtime-specific
implementations explicit.

---

# 20. Runtime adapter contract

Define an explicit runtime adapter.

A possible conceptual API is:

```ts
interface YasumuScriptRuntime {
  readonly kind: string;
  readonly capabilities: RuntimeCapabilities;

  createSession(
    input: CreateRuntimeSessionInput,
  ): Promise<YasumuRuntimeSession>;
}

interface YasumuRuntimeSession {
  invokeHook(
    hook: ScriptHookName,
    input: ScriptHookInvocation,
  ): Promise<ScriptHookResult>;

  dispose(): Promise<void>;
}
```

Runtime capabilities may include:

```ts
interface RuntimeCapabilities {
  workers: boolean;
  nodeBuiltins: boolean;
  filesystem: boolean;
  network: boolean;
  ffi: boolean;
  subprocess: boolean;
  virtualModules: boolean;
}
```

The headless core must use the common contract, not Tanxium-specific
calls.

---

# 21. Worker execution

Extract script execution so that it can operate in workers or worker
threads.

Major JavaScript runtimes support isolated workers:

- Node.js worker threads
- Deno workers
- Bun workers
- Tanxium-managed workers

The implementation should:

- isolate script state per execution or session
- propagate cancellation
- enforce timeouts
- capture logs
- capture uncaught exceptions
- capture unhandled promise rejections
- clean up workers
- avoid leaked subscriptions
- support nested workspace execution
- support virtual modules
- support async hooks
- preserve async context for test APIs
- support execution-scoped state

Do not assume all runtime objects can be transferred across worker
boundaries.

Use explicit serialized messages.

---

# 22. Virtual modules

Support custom virtual modules such as:

```ts
import { expect, test, describe } from 'yasumu:test';
import { workspace } from 'yasumu:workspace';
```

Inspect all existing `yasumu:` modules and preserve or improve their
behavior.

Use runtime-specific module resolution hooks:

- Node.js ESM loader hooks or an equivalent controlled module loader
- Deno module loader integration
- Bun plugin or loader APIs where supported
- Tanxium module loader integration

Virtual module definitions must originate from the shared runtime API
contract.

Do not maintain unrelated handwritten versions for each runtime.

Possible virtual modules include:

```txt
yasumu:workspace
yasumu:test
yasumu:runtime
yasumu:env
yasumu:files
```

Only add modules that provide clear value.

Prefer passing hook context explicitly over hiding everything in
global modules.

Virtual modules should mainly support:

- test registration
- generated types
- workspace-level shared exports
- controlled runtime utilities

---

# 23. Workspace script module

Support a workspace-level script module that can export shared values
and utilities.

For example:

```ts
import { authToken, buildHeaders } from 'yasumu:workspace';
```

The workspace module should be runtime-controlled.

It must:

- load once per appropriate runtime session
- have deterministic lifecycle semantics
- support async initialization if required
- expose only declared exports
- produce useful errors
- avoid cross-workspace state leakage
- avoid cross-execution mutation leaks unless intentionally scoped

Clarify whether workspace module state is:

- per execution
- per worker
- per workspace runtime session

Prefer isolation and predictable behavior over hidden global state.

---

# 24. Testing API

Preserve and improve the current test API.

Support:

```ts
export async function onTest(ctx) {
  describe('authentication', () => {
    test('returns the current user', async () => {
      expect(ctx.res.status).toBe(200);
    });
  });
}
```

Requirements:

- `describe`, `test`, and `expect` only work inside `onTest`
- async tests are supported
- nested suites are supported if currently supported
- failed assertions produce structured results
- thrown errors produce failed test results
- test ordering is deterministic
- timeouts are supported
- cancellation is supported
- test results are serializable
- CLI and GUI display the same underlying results
- test registration does not leak across executions
- concurrent executions do not share test context

Use AsyncLocalStorage in Node.js where appropriate, but do not make
the domain API depend on Node.js AsyncLocalStorage.

Each runtime adapter may implement asynchronous test context using its
native facilities.

---

# 25. Cancellation and timeout behavior

`ctx.cancel()` must cancel the current execution.

Cancellation must propagate to:

- current network request
- nested executions
- email waits
- file reads
- streams
- script hooks
- tests
- worker session cleanup

Expose:

```ts
ctx.signal;
```

for standard cancellation-aware APIs.

Cancellation should produce a structured result rather than an
arbitrary runtime exception.

Distinguish:

- user cancellation
- timeout
- runtime termination
- network abort
- host shutdown

---

# 26. Transport abstraction

Use a transport interface for actual network requests.

The default implementation should use standards-compatible `fetch`.

The transport abstraction must allow:

- Node.js fetch
- Deno fetch
- Bun fetch
- Tanxium transport
- mock transport
- test transport
- future proxy or certificate configuration

Support:

- redirects
- streaming responses
- request timeouts
- cancellation
- TLS options through host capabilities where applicable
- proxy configuration where applicable
- request and response size limits where applicable

Do not place runtime-specific TLS or proxy configuration in the domain
execution pipeline.

---

# 27. Permissions and capabilities

Tanxium currently provides runtime capabilities and permission
behavior.

Preserve the security model while making it runtime-independent.

Define capabilities such as:

- filesystem read
- filesystem write
- network
- environment access
- subprocess
- FFI
- native modules
- workspace files
- email
- nested execution

Scripts should request or declare capabilities where appropriate.

The runtime adapter or host application decides how permissions are
approved.

For example:

- GUI may show a permission prompt
- CLI may use configuration or flags
- CI may deny undeclared capabilities
- trusted server environments may preconfigure capabilities

The headless core should emit a structured permission request.

It must not directly show UI prompts.

---

# 28. CLI assembly

Implement the CLI as a composition of headless services.

The CLI must:

- load `$cwd/yasumu`
- parse `.ysl`
- select workspace and environment
- resolve variables and secrets
- execute REST and GraphQL entities
- run tests
- execute scripts
- support virtual modules
- support file uploads
- support request chaining
- support email APIs when an email provider is configured
- expose useful exit codes
- print structured errors
- support machine-readable output
- support cancellation from terminal signals

A likely command surface may include:

```txt
yasumu run <entity>
yasumu test <entity>
yasumu test
yasumu validate
yasumu list
```

Inspect existing CLI commands before changing the interface.

Preserve backward compatibility where reasonable.

Add a JSON output mode suitable for CI.

---

# 29. GUI assembly

Refactor the Yasumu GUI to assemble the same headless core.

The GUI must:

- use SQLite and Drizzle repositories
- use Tanxium as its runtime adapter
- use GUI-specific file resolution
- use GUI-specific email integration
- subscribe to execution events
- render structured logs and diagnostics
- use the same execution service as the CLI
- use the same interpolation logic
- use the same environment logic
- use the same test runner
- use the same request builder
- use the same script lifecycle
- use the same nested execution behavior

Remove duplicate GUI-only execution logic after parity has been
demonstrated.

Do not retain the old implementation indefinitely behind unclear
compatibility paths.

If a staged migration is needed, use an explicit feature flag and
remove it after tests pass.

---

# 30. Tanxium responsibility

After this refactor, Tanxium should primarily provide:

- JavaScript runtime creation
- module loading
- virtual module integration
- worker lifecycle
- runtime permissions
- host calls
- Web API bindings where required
- protocol communication
- Tauri-specific runtime assembly

Tanxium should not own Yasumu-specific domain behavior such as:

- interpolation rules
- entity lookup
- workspace CRUD
- environment precedence
- test result aggregation
- REST execution policy
- GraphQL execution policy
- reconciliation
- CLI behavior
- GUI behavior

Move these concerns into the headless packages.

---

# 31. Error model

Create a consistent structured error model.

Possible categories:

```ts
type YasumuErrorCode =
  | 'WORKSPACE_NOT_FOUND'
  | 'ENTITY_NOT_FOUND'
  | 'INVALID_ENTITY'
  | 'INVALID_YSL'
  | 'DUPLICATE_ENTITY_ID'
  | 'INTERPOLATION_ERROR'
  | 'MISSING_VARIABLE'
  | 'MISSING_SECRET'
  | 'FILE_NOT_FOUND'
  | 'FILE_ACCESS_DENIED'
  | 'SCRIPT_LOAD_ERROR'
  | 'SCRIPT_RUNTIME_ERROR'
  | 'HOOK_EXECUTION_ERROR'
  | 'REQUEST_FAILED'
  | 'REQUEST_TIMEOUT'
  | 'EXECUTION_CANCELLED'
  | 'EMAIL_TIMEOUT'
  | 'PERMISSION_DENIED'
  | 'RECONCILIATION_CONFLICT';
```

Errors must include:

- stable code
- human-readable message
- optional cause
- entity ID
- workspace ID
- execution ID
- source file and source range when relevant
- safe diagnostic details
- redacted sensitive values

CLI and GUI should present the same underlying error differently
without changing its meaning.

---

# 32. Execution events

Expose structured events.

Examples:

```ts
type ExecutionEvent =
  | ExecutionStartedEvent
  | HookStartedEvent
  | HookCompletedEvent
  | RequestPreparedEvent
  | RequestSentEvent
  | ResponseReceivedEvent
  | RuntimeLogEvent
  | TestStartedEvent
  | TestCompletedEvent
  | NestedExecutionStartedEvent
  | NestedExecutionCompletedEvent
  | PermissionRequestedEvent
  | ExecutionCompletedEvent
  | ExecutionFailedEvent;
```

Events should support:

- GUI progress display
- CLI progress
- debugging
- execution history
- CI output
- nested execution visualization

Do not make event consumers necessary for execution correctness.

---

# 33. Performance requirements

The headless architecture must avoid unnecessary work.

Important requirements:

- cache parsed `.ysl` files by content hash
- incrementally reload changed workspace files
- avoid reparsing unchanged files
- avoid recreating runtimes unnecessarily
- avoid worker leaks
- avoid cloning large binary files
- stream request and response bodies where practical
- avoid serializing huge response bodies unless requested
- allow response body size limits
- make nested execution efficient
- reconcile SQLite and `.ysl` incrementally
- avoid loading all files into memory for simple entity execution
- keep runtime session lifetime explicit

Do not introduce complex caching without clear invalidation semantics.

---

# 34. Migration strategy

Perform the migration incrementally.

## Phase 1: Behavioral mapping

- map current execution behavior
- identify all execution entry points
- identify all script APIs
- identify duplicated logic
- establish parity tests around current behavior

## Phase 2: Shared contracts

- define canonical domain types
- define runtime adapter contract
- define persistence ports
- define file and email ports
- define execution events
- define structured errors
- define script-facing API types

## Phase 3: Headless workspace and CRUD

- implement `.ysl` loading
- implement workspace normalization
- implement entity CRUD services
- implement in-memory repositories
- implement validation and diagnostics

## Phase 4: Headless execution pipeline

- implement interpolation
- implement environment resolution
- implement file resolution
- implement request construction
- implement transport
- implement mock responses
- implement response handling
- implement cancellation

## Phase 5: Script runtime extraction

- extract hook orchestration
- implement runtime protocol
- implement virtual module contracts
- implement test context
- implement nested execution
- implement email API

## Phase 6: Node.js runtime adapter

Implement a functional Node.js runtime adapter using worker threads
and module loading hooks.

This serves as proof that the headless architecture is not coupled to
Tanxium.

It must support:

- loading entity scripts
- loading workspace scripts
- `yasumu:` virtual modules
- hook invocation
- Web Request and Response
- logging
- cancellation
- tests
- nested execution host calls
- email host calls
- file host calls

## Phase 7: CLI migration

- assemble filesystem repositories
- assemble Node.js runtime
- execute sample workspace
- support validation and tests
- support JSON output

## Phase 8: Tanxium adapter

- adapt Tanxium to the shared runtime contract
- generate bootstrap API bindings
- preserve permissions
- preserve current GUI runtime capabilities
- remove domain behavior from Tanxium

## Phase 9: GUI migration

- implement SQLite repositories
- implement `.ysl` reconciliation
- assemble headless services
- replace old request execution path
- replace old test path
- replace old script orchestration
- verify UI behavior

## Phase 10: Cleanup

- remove duplicated execution logic
- remove obsolete types
- remove stale adapters
- remove compatibility paths
- update documentation
- review package boundaries

---

# 35. Testing requirements

Add comprehensive tests.

## 35.1 Unit tests

Test:

- `.ysl` discovery
- parsing
- schema validation
- duplicate IDs
- workspace normalization
- variable interpolation
- secret resolution
- environment precedence
- request construction
- GraphQL body construction
- headers
- query parameters
- JSON bodies
- form data
- multipart uploads
- file references
- mock responses
- cancellation
- timeout classification
- error serialization
- secret redaction
- reconciliation classification
- three-way merge behavior
- nested execution depth
- email lifecycle window
- test context isolation

## 35.2 Runtime contract tests

Create a shared runtime conformance test suite.

Run the same tests against:

- Node.js runtime adapter
- Tanxium runtime adapter

The suite should verify:

- hook ordering
- request access
- response access
- mocked response behavior
- error propagation
- cancellation
- runtime logs
- virtual modules
- workspace module
- tests
- nested REST execution
- nested GraphQL execution
- email API
- file API

Future Deno and Bun adapters should be able to run the same suite.

## 35.3 CLI integration tests

Using `test-workspace/yasumu`, test:

- workspace validation
- REST execution
- GraphQL execution
- test mode
- variables
- secrets
- file upload
- mocked response
- chained request
- runtime failure
- invalid `.ysl`
- JSON output
- exit codes

## 35.4 GUI integration tests

Test the headless GUI assembly without requiring the full visual UI
where possible.

Test:

- SQLite entity loading
- execution using Tanxium
- `.ysl` import
- incremental reconciliation
- conflict detection
- execution event delivery
- test result delivery

---

# 36. Compatibility and behavior parity

The GUI and CLI must behave predictably and consistently.

For the same workspace, entity, environment, and secrets, they should
produce equivalent:

- request URL
- request method
- request headers
- request body
- interpolation result
- script hook order
- mock behavior
- response representation
- test results
- nested execution behavior
- errors
- cancellation semantics

Runtime-specific differences must be explicit and capability-based.

Do not allow silent behavior differences.

Add parity tests using normalized execution snapshots.

---

# 37. Documentation

Add architecture documentation explaining:

- package responsibilities
- execution lifecycle
- runtime adapter contract
- script hook semantics
- request and response semantics
- virtual modules
- workspace API
- environment precedence
- secret handling
- file handling
- email lifecycle behavior
- nested execution
- `.ysl` loading
- SQLite reconciliation
- adding a new runtime adapter
- generated API contracts
- running runtime conformance tests

Add script API documentation with examples.

Example:

```ts
export async function onRequest(ctx) {
  const token = ctx.workspace.env.getSecret('API_TOKEN');

  ctx.setRequest(
    new Request(ctx.req, {
      headers: {
        ...Object.fromEntries(ctx.req.headers),
        authorization: `Bearer ${token}`,
      },
    }),
  );
}

export async function onResponse(ctx) {
  console.log('Status:', ctx.res.status);
}

export async function onTest(ctx) {
  test('returns 200', () => {
    expect(ctx.res.status).toBe(200);
  });
}
```

Ensure examples match the final implemented API exactly.

---

# 38. Constraints

- Do not rewrite the entire application from scratch.
- Do not couple the headless core to Tauri.
- Do not couple the headless core to Node.js.
- Do not couple domain logic to SQLite or Drizzle.
- Do not duplicate script API definitions across runtimes.
- Do not maintain separate execution semantics for CLI and GUI.
- Do not weaken the schema to make migration easier.
- Do not silently drop unsupported existing behavior.
- Do not expose secrets in diagnostics.
- Do not transfer large file bodies through workers unnecessarily.
- Do not use modification time as the only reconciliation mechanism.
- Do not use global mutable state for active tests.
- Do not let nested executions recurse indefinitely.
- Do not leave placeholder implementations where repository behavior
  can be completed.
- Do not introduce speculative abstractions unrelated to current
  requirements.
- Do not create a generic framework detached from Yasumu's actual use
  cases.
- Do not retain obsolete execution paths after migration.
- Do not change the visual design of the GUI as part of this task.
- Do not perform unrelated frontend cleanup.

---

# 39. Definition of done

The task is complete only when:

1. A headless Yasumu domain and execution layer exists.
2. `.ysl` workspaces can be loaded from `$cwd/yasumu`.
3. `test-workspace/yasumu` can be validated and executed.
4. REST execution uses the shared headless pipeline.
5. GraphQL execution uses the shared headless pipeline.
6. variable interpolation is shared.
7. environment resolution is shared.
8. secret resolution is shared.
9. script hooks are shared.
10. Web `Request` and `Response` are exposed to scripts.
11. mocked responses work through `onRequest`.
12. `onResponse` runs for real and mocked responses.
13. `onTest` works consistently.
14. virtual `yasumu:` modules work.
15. request chaining works across REST and GraphQL.
16. email waiting supports the execution lifecycle window.
17. form data and file uploads work in CLI and GUI.
18. cancellation propagates correctly.
19. Node.js runtime execution works.
20. Tanxium implements the same runtime contract.
21. the CLI uses the headless implementation.
22. the GUI uses the headless implementation.
23. SQLite and `.ysl` reconciliation exists.
24. runtime API definitions are generated or validated from one
    source.
25. runtime conformance tests pass for Node.js and Tanxium.
26. CLI and GUI parity tests pass.
27. obsolete duplicate execution logic is removed.
28. documentation reflects the implemented design.
29. all relevant formatting, lint, type-checking, Rust, test, and
    build commands pass.

---

# 40. Required final report

At the end, provide a concise implementation report containing:

## Architecture

- packages created or changed
- responsibility of each package
- dependency direction
- execution lifecycle
- runtime adapter design

## Migration

- old execution paths replaced
- logic moved out of Tanxium
- logic moved out of the GUI
- CLI integration
- GUI integration

## Script API

- final hook context types
- workspace APIs
- virtual modules
- mocking behavior
- request chaining
- email behavior
- file behavior

## Persistence

- CLI `.ysl` loading
- SQLite repository design
- reconciliation algorithm
- conflict behavior

## Validation

- commands run
- tests added
- runtime conformance results
- CLI integration results
- GUI parity results
- build results

## Remaining limitations

Clearly state any behavior that could not safely be migrated,
including the exact reason and affected files.

Do not claim completion for partially implemented adapters or
placeholder code.
