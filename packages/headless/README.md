# `@yasumu/headless`

The runtime-independent Yasumu domain and execution layer. It owns workspace
normalization, validation, CRUD, interpolation, request construction, lifecycle
orchestration, structured events/errors, cancellation, nesting, email windows,
files, workspace cookie policy, SSE parsing/reconnects, and reconciliation.

It depends only on the schema and runtime contract packages. Filesystems,
SQLite/Drizzle, Tanxium, Node workers, Tauri, terminal output, and React are
provided through adapters.

REST, GraphQL, and SSE entities share request construction and lifecycle
hooks. SSE execution publishes open/event notifications, honors server retry
directives and `Last-Event-ID`, supports event filters and deterministic event
limits, and returns collected events in the canonical execution result.

REST responses with `text/event-stream` are incrementally parsed through the
same event pipeline while retaining their REST identity. `WorkspaceCookieJar`
provides persistence-independent domain, path, expiry, security-flag, and
`Set-Cookie` behavior. Hosts supply a repository: the desktop uses a
workspace-scoped SQLite table and the CLI uses an ephemeral in-memory jar.
Cookie credentials are excluded from persisted execution history.
