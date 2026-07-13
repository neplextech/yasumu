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

`RuntimeHost` is intentionally small: embedders decide how to present
events and confirmation requests. Tanxium owns virtual modules,
workspace/resource context, module loading, workers, and the
JavaScript `Yasumu` bootstrap.

Use `send_event` to deliver serialized frontend or host events to a
running runtime. Use `tanxium-yasumu` when embedding in a Tauri
application.

## Permissions

The main worker receives all permissions by default, preserving the
behavior expected by trusted embedders such as Yasumu's GUI bootstrap.
Set `allow_main_worker_all_permissions(false)` to start it sandboxed.
Permission requests are then delegated to the `RuntimeHost` permission
prompter. Web workers always start with no permissions and prompt when
they need one, regardless of this main-worker setting.
