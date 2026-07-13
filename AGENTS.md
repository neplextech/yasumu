# Yasumu contributor and agent guide

## Project

Yasumu is a desktop-first API development and testing platform. The
desktop application combines a Next.js frontend, a Tauri shell, and an
embeddable Deno-based JavaScript/TypeScript runtime named **Tanxium**.
The repository is a pnpm workspace and a root Cargo workspace; both
are first-class parts of the project.

## Repository map

```text
apps/
  docs/                 Fumadocs documentation site
  www/                  Next.js marketing site
  yasumu/               Next.js desktop frontend and Tauri application
    src-tauri/          Yasumu application crate; consumes tanxium-yasumu
crates/
  tanxium/              Publishable, Tauri-free runtime library
  tanxium-cli/          Internal `tanxium` CLI and REPL
  tanxium-yasumu/       Tauri host adapter for Tanxium
packages/
  common/               Lightweight shared utilities and types
  core/                 Typed RPC client
  rpc/                  Pure RPC contract layer
  schema/               YSL entity schema and serialization
  tanxium/              JavaScript server/runtime package bundled for Yasumu
  test/                 Yasumu script-testing package
  ui/                   Shared shadcn/ui component library
tests/
  tanxium-runtime/      Vitest semantic tests that execute the real CLI
Cargo.toml              Root Rust workspace manifest
pnpm-workspace.yaml     Root JavaScript workspace manifest
```

## Architecture and dependency rules

### Application and RPC

The frontend calls `packages/core`, which uses contracts in
`packages/rpc` to communicate with the Tauri backend. Keep
`packages/rpc` free of runtime or application logic, and keep
`packages/common` lightweight. Do not introduce cross-package circular
dependencies.

### Tanxium

`crates/tanxium` owns the Deno worker, module loader, custom ops,
embedded Yasumu bootstrap, `yasumu:*` modules, virtual modules, and
runtime state. It must never depend on Tauri.

`crates/tanxium-yasumu` is the only Tauri-aware Tanxium crate. It
translates Tanxium events, paths, dialogs, and application state to
Tauri. The Yasumu app crate should consume this adapter rather than
reimplement runtime behavior.

`crates/tanxium-cli` provides `tanxium run` and `tanxium repl`. It is
internal (`publish = false`) but must exercise the same JavaScript
runtime contract as the Tauri host. `tanxium` is the only publishable
crate.

When adding or changing a JavaScript runtime API:

1. Implement the generic operation/state behavior in `crates/tanxium`.
2. Add host-specific behavior only through `RuntimeHost` or
   `tanxium-yasumu`.
3. Keep the Tauri and CLI behaviors documented.
4. Add semantic coverage under `tests/tanxium-runtime`; do not use
   source-text assertions as runtime tests.

## Commands and validation

Run commands from the repository root unless a command states
otherwise.

```sh
# Rust workspace
cargo fmt --all
cargo check --workspace
cargo package --allow-dirty --no-verify -p tanxium

# Tanxium CLI/runtime semantics
pnpm --filter @yasumu/tanxium-runtime-tests test

# JavaScript workspace
pnpm install --frozen-lockfile
pnpm build
pnpm format
```

The runtime test suite builds and runs the real CLI. It covers
TypeScript execution, runtime context, virtual modules, node_modules
resolution, renderer events, and REPL behavior.

## Releases and publishing

- Yasumu desktop release workflows live in
  `.github/workflows/release.yml` and `.github/workflows/canary.yml`.
- Cargo CI lives in `.github/workflows/cargo.yml` and checks the root
  workspace.
- `tanxium` publishes through `.github/workflows/publish-tanxium.yml`
  using crates.io OIDC trusted publishing. Do not add a long-lived
  crates.io token. Configure the crates.io trusted publisher with the
  workflow and `crates-io` GitHub environment before publishing.

## Documentation and quality

- Update `apps/docs` for public-facing Yasumu behavior.
- Update `crates/tanxium/README.md` and `crates/tanxium/docs/` for
  public Tanxium APIs, CLI changes, and embedding guidance.
- Public Rust API must have rustdoc. Keep CLI code split by
  responsibility; avoid placing command parsing, terminal hosting, and
  REPL logic in one file.
- Use `cargo fmt`, `pnpm format`, and focused tests before handing off
  a change.

## Code-review graph

This project may expose code-review-graph MCP tools. Use them before
broad file searches when they are available. If the graph is empty or
unavailable, fall back to targeted `rg` and direct file inspection.
