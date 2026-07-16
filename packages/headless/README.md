# `@yasumu/headless`

The runtime-independent Yasumu domain and execution layer. It owns workspace
normalization, validation, CRUD, interpolation, request construction, lifecycle
orchestration, structured events/errors, cancellation, nesting, email windows,
files, and reconciliation.

It depends only on the schema and runtime contract packages. Filesystems,
SQLite/Drizzle, Tanxium, Node workers, Tauri, terminal output, and React are
provided through adapters.
