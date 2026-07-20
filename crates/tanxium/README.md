# Tanxium

Tanxium is an embeddable JavaScript and TypeScript runtime built on
[Deno](https://deno.com/). It provides Yasumu's script bootstrap,
module loading, Node.js compatibility, virtual modules, workers, and
runtime APIs without requiring Tauri. Use it when you need the same
script contract in a desktop app, CLI, service, test harness, or other
host application.

When hosted by Yasumu, the generated `yasumu:workspace` module exposes
cross-module REST, GraphQL, and SSE execution. An SSE hook can invoke a
REST or GraphQL entity, and any request hook can start a saved SSE stream
with a deterministic `maxEvents` limit. Tanxium transports these calls
through its generic host-call protocol; request and stream policy remains
in the reusable headless package. Yasumu's host also shares one
workspace-scoped cookie jar across those cross-module calls; Tanxium itself
does not own or persist application credentials.

## Install

Add the library to an embedding application:

```toml
[dependencies]
tanxium = "0.2"
```

For a ready-to-use executable, install the companion CLI:

```sh
cargo install tanxium-cli
tanxium run script.ts
```

Prebuilt CLI downloads are available from the
[GitHub Releases page](https://github.com/neplextech/yasumu/releases).

## Embed the runtime

`Tanxium::builder()` keeps application concerns at the host boundary.
Configure the workspace and resource roots, supply a host for runtime
events and permission decisions, then start a JavaScript or TypeScript
entrypoint.

```rust
use std::sync::Arc;
use tanxium::{RuntimeEvent, RuntimeHost, Tanxium};

struct Host;

impl RuntimeHost for Host {
    fn emit_event(&self, event: RuntimeEvent) {
        println!("{event:?}");
    }
}

Tanxium::builder()
    .workspace_dir("./workspace")
    .resource_dir("./resources")
    .host(Arc::new(Host))
    .build()?
    .run_file("./script.ts")?;
```

The runtime owns the Deno event loop, TypeScript transpilation,
Node/CommonJS and ESM package resolution, built-in `yasumu:*` modules,
virtual modules, and the `globalThis.Yasumu` bootstrap. `RuntimeHost`
is intentionally small: embedders decide how to surface renderer
events, confirmation requests, and permission prompts.

## Permissions and workers

The main worker receives all Deno permissions by default so trusted
host bootstrap code remains compatible. Set
`allow_main_worker_all_permissions(false)` to start it sandboxed and
delegate permission decisions to the host. Web workers always start
without permissions and request them on demand.

The companion CLI takes the safer default: its main worker is
sandboxed. Use `--sandbox false` or `--no-sandbox` for a trusted
entrypoint. Interactive terminals offer allow-once, allow-all, and
deny choices; non-interactive sessions deny prompts.

## CLI

```sh
# Execute an entrypoint. Workspace and resources default to the current directory.
tanxium run script.ts

# Resolve packages from a different workspace or resource root.
tanxium run script.ts --workspace ./workspace --resources ./resources

# Start an interactive session with multiline input and top-level await.
tanxium repl
```

Pass `--verbose` to print renderer events such as structured console
and notification output. Normal script output remains clean by default.

## Documentation

- [Embedding guide](docs/embedding.md)
- [CLI reference](docs/cli.md)
- [Publishing guide](docs/publishing.md)
- [Yasumu](https://github.com/neplextech/yasumu)

## License

Tanxium is licensed under [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html).
