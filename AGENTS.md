## Project Overview

Yasumu is a monorepo structured around a desktop-first API testing and
development tooling platform. It combines a Tauri-based desktop shell
with an embedded JavaScript runtime (`deno_runtime`) and an RPC-driven
architecture for communication between the frontend and the native
layer.

---

## Repository Structure

```
yasumu/
├── apps/
│   ├── docs/         # Documentation site (Fumadocs)
│   ├── www/          # Marketing and landing page (Next.js)
│   └── yasumu/       # Desktop application (Next.js + Tauri)
│       └── src-tauri/
│           └── src/
│               └── tanxium/  # Native Rust foundation for the JS runtime
└── packages/
├── cli/
├── common/
├── core/
├── den/
├── rpc/
├── schema/
├── shared/
├── tanxium/
├── test/
└── ui/
```

---

## Apps

### `apps/docs`

Documentation site for Yasumu, built with
[Fumadocs](https://fumadocs.vercel.app). Any changes to public APIs,
runtime behavior, or workspace packages should be reflected here.

### `apps/www`

The marketing and landing page, built with Next.js. Primarily static
content; avoid coupling it to internal packages unnecessarily.

### `apps/yasumu`

The core desktop application. Built with Next.js (frontend) and Tauri
(native shell). This app hosts Yasumu's custom JavaScript runtime,
which is powered by the `deno_runtime` crate via the `tanxium` Rust
module located at `src-tauri/src/tanxium`.

**Key characteristics:**

- The frontend communicates with the Tauri backend via the RPC layer
  (`packages/rpc` + `packages/core`).
- The embedded JS runtime executes user scripts inside a sandboxed
  Deno-based environment.
- Custom Rust ops defined in `tanxium` extend the runtime with
  Yasumu-specific capabilities.

---

## Packages

### `packages/cli`

Command-line interface for Yasumu. Useful for scripting, CI
integration, and headless operation.

### `packages/common`

Shared utilities, constants, and TypeScript types consumed across apps
and packages. Keep this package free of heavy dependencies and side
effects.

### `packages/core`

The RPC client library. Wraps the RPC layer and exposes a typed,
ergonomic API for use in frontend apps. This is what `apps/yasumu`
imports to communicate with the Tauri backend.

### `packages/den`

Yasumu's internal dependency injection container and module system,
architecturally inspired by NestJS. Handles service registration,
lifecycle management, and module boundaries within the runtime
environment.

### `packages/rpc`

The RPC contract layer. Defines shared types, resolver interfaces, and
client/server boundaries. Both `packages/core` (client) and the Tauri
backend (server) depend on this package. Do not introduce
runtime-specific logic here; it should remain a pure contract.

### `packages/schema`

Implements the custom DSL (YSL) used to define Yasumu entity objects
(environments, workspaces, requests, etc.). Changes here directly
affect persistence and serialization behavior across the application.

### `packages/shared`

Monorepo-level shared configuration: TypeScript base configs, ESLint
presets, build tool configs. Not consumed at runtime.

### `packages/tanxium`

The JavaScript-side counterpart to the native `tanxium` Rust module.
This package runs inside Yasumu's embedded JS runtime and provides:

- Runtime APIs exposed to user scripts
- Orchestration logic for the embedded script execution environment
- Bridging between the JS execution context and the Tauri/RPC layer

> When modifying this package, changes must be validated against the
> native Rust implementation in `apps/yasumu/src-tauri/src/tanxium` to
> ensure op signatures and behavior remain in sync.

### `packages/test`

A lightweight, Yasumu-native testing framework designed for testing
scripts executed within the runtime. Features a synchronous authoring
API with async-under-the-hood execution. Intended for use in
user-facing test scripts, not for testing the Yasumu codebase itself
(use the root-level test tooling for that).

### `packages/ui`

Shared React component library built on
[shadcn/ui](https://ui.shadcn.com). Provides consistent design system
primitives across `apps/yasumu` and `apps/www`. Component additions
should follow the existing shadcn composition patterns.

---

## Architecture Notes

### RPC Flow

```
Frontend (Next.js)
└─ packages/core (RPC client)
└─ packages/rpc (shared contract)
└─ Tauri backend (Rust)
└─ tanxium (JS runtime + custom ops)
```

### JavaScript Runtime

The embedded runtime is Deno-based (`deno_runtime` crate). User
scripts run inside this environment with access to APIs provided by
`packages/tanxium`. The runtime is intentionally sandboxed;
capabilities are explicitly granted via custom Rust ops.

### Module Dependency Rules

- `packages/rpc` must remain free of app-specific logic.
- `packages/common` must remain lightweight with no heavy runtime
  dependencies.
- `packages/tanxium` (JS) and `apps/yasumu/src-tauri/src/tanxium`
  (Rust) are tightly coupled; changes to one _almost always_ require
  changes to the other.
- `packages/shared` is build-time only and must never be imported at
  runtime.

---

## Agent Guidelines

- When modifying the RPC contract (`packages/rpc`), update both the
  client (`packages/core`) and any Tauri resolver implementations.
- When adding new runtime APIs, implement the Rust op in
  `src-tauri/src/tanxium` first, then expose it through
  `packages/tanxium`.
- Schema changes in `packages/schema` may require migration handling;
  check for any serialization consumers before modifying entity
  shapes.
- Do not add cross-package circular dependencies. The dependency graph
  flows: `shared` → `common` → `rpc` → `core` → apps.
- Documentation changes for any public-facing behavior belong in
  `apps/docs`.
