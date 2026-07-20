# Embedding Tanxium

Construct a runtime with `Tanxium::builder()`, supplying any
host-specific behavior through `RuntimeHost`.

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
    .allow_main_worker_all_permissions(false)
    .host(Arc::new(Host))
    .build()?
    .run_file("./script.ts")?;
```

The path passed to `run_file` is the embedder's physical main module.
Relative imports continue to resolve from that file, so hosts can
package an application module tree using their native resource system.
Tanxium's private `ext:tanxium_rt/*` bootstrap modules are embedded in
its build-generated snapshot bundle and do not need to be copied into
the host application's resources.

`RuntimeHost` is intentionally small: embedders decide how to present
events and confirmation requests. Tanxium owns virtual modules,
workspace/resource context, module loading, workers, and the
JavaScript `Yasumu` bootstrap.

Use `send_event` to deliver serialized frontend or host events to a
running runtime. Use `tanxium-yasumu` when embedding in a Tauri
application.

## Yasumu request host calls

The shared runtime contract includes REST, GraphQL, and SSE entity
lookup and execution. Yasumu's Tanxium adapter implements those calls
with the canonical headless executor, so scripts can cross-invoke
modules through `workspace.rest`, `workspace.graphql`, and
`workspace.sse`. SSE executions use the same cancellation and lineage
as their parent and accept `maxEvents` for deterministic completion.

Bare Tanxium embedders remain application-independent: they can
provide their own host-call implementation or omit the Yasumu request
APIs.

## Permissions

The main worker receives all permissions by default, preserving the
behavior expected by trusted embedders such as Yasumu's GUI bootstrap.
Set `allow_main_worker_all_permissions(false)` to start it sandboxed.
Permission requests are then delegated to the `RuntimeHost` permission
prompter. Web workers always start with no permissions and prompt when
they need one, regardless of this main-worker setting.

## HTTP imports

HTTPS module imports are enabled by default. To allow insecure HTTP
module imports for a trusted development or local-network environment,
opt in with `allow_http_imports(true)` on the builder. This setting is
disabled by default.
