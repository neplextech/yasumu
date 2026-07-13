# Tanxium Rust Workspace Design

## Goal

Extract the embedded Tanxium runtime from Yasumu's Tauri crate into a reusable Rust workspace. The runtime must be usable as a library, a small JavaScript/TypeScript CLI, and through a Tauri adapter without changing the existing Yasumu JavaScript runtime contract.

## Workspace

Create a Rust workspace at `rust/` alongside the pnpm workspace:

```text
rust/
  Cargo.toml
  crates/
    tanxium/         # reusable runtime library
    tanxium-cli/     # `tanxium` command-line executable
    tanxium-yasumu/  # Tauri host integration
```

`apps/yasumu/src-tauri` becomes a consumer of `tanxium-yasumu`. Neither `tanxium` nor `tanxium-cli` depends on Tauri.

## Public API

`tanxium` owns the Deno runtime, module loader, Node resolution, worker lifecycle, retries, virtual modules, custom operations, built-in `yasumu:*` modules, and the existing `globalThis.Yasumu` bootstrap.

Embedders construct a runtime through a builder:

```rust
let runtime = Tanxium::builder()
    .workspace_dir(workspace_dir)
    .resource_dir(resource_dir)
    .host(host)
    .build()?;

runtime.run_module(module)?;
```

The core uses a small `RuntimeHost` interface for platform policy:

```rust
pub trait RuntimeHost: Send + Sync + 'static {
    fn emit_event(&self, event: RuntimeEvent);
    fn permission_prompt(&self, request: PermissionRequest) -> PromptResponse;
    fn confirm(&self, request: ConfirmationRequest) -> bool;
    fn runtime_context(&self) -> RuntimeContext;
    fn on_runtime_failure(&self, error: &RuntimeError);
}
```

`RuntimeContext` holds application paths/version/dev mode/readiness, workspace and resource directories, and service-port state. The core has an in-memory state implementation so headless embedders do not need application state. Its safe default host ignores events and denies confirmation and permission prompts unless configured otherwise.

## Hosts

`tanxium-yasumu` supplies `TauriHost`. It maps current renderer events to the unchanged `tanxium-event` payload, uses Tauri dialogs for confirmation and permission prompts, provides Tauri paths and package metadata, and retains the existing crash dialog/exit policy. It also exposes a small bridge used by Tauri commands to deliver frontend events and inspect or update runtime state.

The CLI uses a terminal host. Permission and confirmation requests are interactive prompts when attached to a TTY. Renderer events, console messages, and notifications are printed as structured stdout/stderr output. The same `Yasumu` JavaScript bootstrap remains available in CLI and headless modes.

## CLI

The CLI remains deliberately small:

```text
tanxium run <file> [--workspace <path>] [--resources <path>]
```

Both `--workspace` and `--resources` default independently to the current working directory. The CLI executes one JS/TS entry module; context injection remains available through the two flags and the library builder.

## Migration

Move all runtime Rust files and embedded TypeScript assets from `apps/yasumu/src-tauri/src/tanxium` to `rust/crates/tanxium`. Replace all direct Tauri references in those files with the host and state interfaces. Preserve operation names and JavaScript behavior.

Move the Tauri-specific behavior into `tanxium-yasumu`, then reduce the desktop app to Tauri setup, commands, and adapter wiring. Keep the current retry/backoff loop in the core, while failure presentation and termination is host policy.

## Regression Coverage

Core integration tests execute fixture modules and cover TypeScript execution, bootstrap availability, virtual modules, workspace/resource context, event forwarding, permission and confirmation routing, and failure/retry reporting. Adapter tests cover state and event mapping without requiring a running desktop UI. CI/build verification compiles every Rust workspace member and the Yasumu Tauri crate.
