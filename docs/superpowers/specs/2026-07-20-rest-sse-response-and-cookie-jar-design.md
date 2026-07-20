# REST SSE Responses and Workspace Cookie Jar

Date: 2026-07-20
Status: Approved

## Objective

Improve REST response handling when a server returns `text/event-stream`, and add an editable cookie jar that is isolated to one Yasumu workspace. REST streaming is viewer compatibility, not a second SSE module. Cookies are local application state and must never be serialized to YSL files or exported through workspace synchronization.

## Scope

This change includes:

- incremental parsing and display of SSE-formatted REST responses;
- status and headers as soon as a REST stream opens;
- cancellation that preserves events already received;
- a workspace-scoped cookie model, persistence repository, RPC API, typed core client, and GUI;
- automatic cookie selection and `Set-Cookie` ingestion for REST, GraphQL, SSE, nested executions, and renderer-side workspace HTTP operations such as GraphQL introspection;
- disabling the independent application-global cookie jar in the Tauri HTTP plugin;
- tests and public documentation for both behaviors.

This change does not add reconnect configuration, event filters, or other SSE-module controls to REST entities. It does not place cookies in workspace source files.

## Architecture

### REST event-stream compatibility

`packages/headless` remains the canonical execution boundary. The existing SSE parser will expose a single-response consumption path that accepts an already-open `Response`. The SSE module will continue to layer reconnection, retry, event filtering, and event limits on top of it.

For a REST entity, the executor sends the request normally and inspects the response `Content-Type`. A `text/event-stream` response is passed to the shared single-response consumer with reconnection and filters disabled. The executor emits the existing stream-open and event-received execution events and accumulates parsed events in `ExecutionResult.events`. The entity kind remains `rest`, so scripts, tests, nested execution, cancellation, history, and analytics continue to use REST behavior.

The REST request hook will recognize live stream events. It will create response metadata when the stream opens, append events incrementally, and retain that state when the user cancels. The response panel will render an Events tab for streaming responses while preserving the existing Body, Preview, Headers, Cookies, Console, and Tests behavior for ordinary responses.

### Workspace cookie jar

`packages/headless` will define the cookie domain model, repository port, parsing and matching rules, and a workspace cookie-jar service. Cookie application belongs beside request execution rather than in a feature module so every executable HTTP entity gets identical behavior.

`packages/tanxium` will implement the repository with a dedicated SQLite table keyed by stable cookie IDs and scoped by `workspaceId`. Stored fields include name, value, domain, path, expiry, secure, HTTP-only, SameSite, and host-only state. Expired cookies are removed during reads and response ingestion.

The GUI execution platform will construct one cookie-jar service backed by this repository and share it between the headless executor and the cookie RPC module. Before a request, the executor asks the jar for cookies matching the URL and adds them unless the request already supplies an explicit `Cookie` header. After a response, all available `Set-Cookie` headers are ingested. Explicit request headers take precedence without mutating the jar.

The Tauri HTTP plugin's built-in cookie feature will be disabled because it owns one application-global jar. Renderer-side workspace fetches will use a small `tauriFetch` adapter that gets the matching workspace cookie header through the typed core API, executes the request, and sends response cookies back to the same jar. RPC discovery traffic remains cookie-free.

Cookie values will not be written to YSL, source revisions, workspace synchronization output, automatic logs, or persisted execution history. Live response data can still display cookies returned by the current request.

## Cookie behavior

The jar follows standard HTTP cookie selection rules relevant to an API client:

- domain and host-only matching;
- path matching and default-path calculation;
- secure cookies only on HTTPS;
- expiry and `Max-Age`, including deletion through an expired replacement;
- cookie replacement by name, domain, and path;
- deterministic ordering by longest path and then creation time;
- HTTP-only and SameSite fields retained for editing and inspection.

The editor validates cookie names, domains, paths, expiry values, and the `SameSite=None` plus `Secure` constraint before saving.

## RPC and core API

The RPC contract will expose workspace-relative cookie operations:

- list all unexpired cookies;
- create or update a cookie;
- delete one cookie;
- clear the workspace jar;
- resolve the outbound `Cookie` header for a URL;
- ingest `Set-Cookie` values for a response URL.

`packages/core` will expose these operations as `workspace.cookies`. Contracts remain data-only; parsing, matching, validation, and persistence stay below the RPC layer.

## User interface

The workspace sidebar will expose a Cookie Jar action that opens a reusable right-side sheet without navigating away from the active request. The sheet uses the existing Yasumu visual system and contains:

- a searchable table showing name, domain, path, expiry, and security flags;
- add and edit dialogs with explicit labeled fields;
- per-cookie delete actions;
- a guarded Clear Jar action;
- empty, loading, validation, and mutation-error states;
- immediate query invalidation after successful mutations.

The sheet is workspace-keyed so switching workspaces cannot retain another workspace's rows or draft state. Derived filtering and counts are calculated during render; effects are reserved for external lifecycle synchronization only.

## Error handling and security

Malformed `Set-Cookie` values are ignored individually and surfaced as non-fatal diagnostics where execution diagnostics are available. A storage failure must not silently change a request: it fails the cookie operation, while ordinary requests without cookie integration remain usable when no jar is configured. Cookie values are never emitted in execution events.

The REST streaming parser preserves its existing UTF-8, BOM, multiline data, event ID, retry, cancellation, and reader-cleanup guarantees. A non-SSE REST response follows the current snapshot path exactly.

## Validation

Automated coverage will verify:

- REST event-stream detection, incremental events, cancellation, cleanup, and ordinary-response regression behavior;
- cookie parsing, replacement, expiry, domain/path/secure matching, explicit-header precedence, and response ingestion;
- per-workspace SQLite isolation and persistence;
- RPC and core CRUD behavior;
- renderer `tauriFetch` cookie application and ingestion;
- REST GUI live-event state and cookie-jar UI behavior;
- cookie exclusion from YSL reconciliation and persisted history;
- GraphQL, SSE, nested execution, and GraphQL introspection sharing the same workspace jar.

Repository validation will include the affected package tests, frontend lint and type checks, `pnpm build`, runtime semantic tests, Rust formatting/checking, and Tanxium packaging.
