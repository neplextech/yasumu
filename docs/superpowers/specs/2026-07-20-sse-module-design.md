# Full SSE module

## Goal

Replace the placeholder SSE screen with a persistent, end-to-end Server-Sent
Events module. SSE must execute through the shared headless lifecycle with
interpolation, lifecycle scripts, tests, cancellation, reconnect behavior, and
event delivery in the desktop application and CLI. Script runtimes must expose
SSE alongside REST and GraphQL so any supported entity script can invoke any
other supported entity type.

## Domain and persistence

Introduce `SseEntity` as a first-class executable entity with URL, HTTP method,
headers, path/search parameters, optional body, event filters, reconnect policy,
and scripts. Add `@sse` parsing/serialization, database storage/mappers,
workspace schema support, CRUD/RPC/core APIs, entity groups, history, and
runtime API types. Existing workspace group compatibility remains intact.

## Headless execution

The headless layer builds SSE requests with the same canonical interpolation and
file/body handling as REST. An SSE transport opens the response stream, validates
the event-stream content type, parses frames (`id`, `event`, `data`, `retry`),
and emits stream events. It runs request hooks before connecting, event/response
hooks for received data, and tests through the existing script session. It tracks
response metadata and a bounded event history. Cancellation closes the reader.

Connections reconnect until cancellation, timeout, or configured max-event
limit. Reconnect delay follows a valid server `retry:` directive or a configured
fallback; reconnect requests include `Last-Event-ID` after an event supplies an
ID. Transport errors and invalid streams produce normal structured execution
errors.

## Runtime scripting

Extend script entity contracts and host calls from `rest | graphql` to
`rest | graphql | sse`. `ctx.workspace.sse.get/list/execute` mirrors the current
REST and GraphQL APIs. Nested executions preserve environment, cancellation,
lineage, logs, tests, and permission handling. REST, GraphQL, and SSE scripts
can invoke each other through one generic headless execution entry point.

## Hosts and presentation

Tanxium GUI assembly supplies the stream transport and republishes per-event
execution events. The desktop UI follows REST/GraphQL reusable patterns:
real file tree, entity tabs/history, request editor (URL/body/parameters/headers
and scripts), interpolation-aware controls, connect/cancel action, and live
event/response/error views. The old placeholder SSE UI is removed.

The CLI recognizes SSE in list/run/test and presents bounded event results in
human and JSON formats. It exposes stream limits suitable for non-interactive
use. When a CLI request targets `echo.yasumu.local`, its transport starts or
resolves the embedded echo server and rewrites only that host to its loopback
address.

## Echo server and validation

Add a deterministic SSE echo endpoint that reflects request headers, body, and
query data in event payloads and emits IDs/retry directives. Test parsing,
interpolation, reconnects, cancellation, nested cross-entity execution,
persistence, GUI event adapters, CLI echo resolution, and user-facing module
flows. Update API, architecture, request, scripting, CLI, and SSE documentation.
