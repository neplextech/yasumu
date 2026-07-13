use crate::state::RuntimeEvent;
use crate::types::RuntimeHostState;
use cuid2::cuid;
use deno_core::{OpState, op2};

#[inline]
fn get_runtime(state: &OpState) -> RuntimeHostState {
    let runtime = state.borrow::<RuntimeHostState>();
    RuntimeHostState {
        host: runtime.host.clone(),
        state: runtime.state.clone(),
    }
}

#[op2(fast)]
fn op_send_renderer_event(state: &mut OpState, #[string] event: &str) {
    get_runtime(state)
        .host
        .emit_event(RuntimeEvent::Renderer(event.to_string()));
}

#[op2(fast)]
fn op_register_virtual_module(state: &mut OpState, #[string] key: &str, #[string] code: &str) {
    get_runtime(state)
        .state
        .virtual_modules
        .lock()
        .expect("virtual modules lock poisoned")
        .insert(key.to_string(), code.to_string());
}

#[op2(fast)]
fn op_unregister_virtual_module(state: &mut OpState, #[string] key: &str) {
    get_runtime(state)
        .state
        .virtual_modules
        .lock()
        .expect("virtual modules lock poisoned")
        .remove(key);
}

#[op2(fast)]
fn op_unregister_all_virtual_modules(state: &mut OpState) {
    get_runtime(state)
        .state
        .virtual_modules
        .lock()
        .expect("virtual modules lock poisoned")
        .clear();
}

#[op2]
#[string]
fn op_get_resources_dir(state: &mut OpState) -> String {
    get_runtime(state)
        .state
        .context
        .read()
        .expect("runtime context lock poisoned")
        .resource_dir
        .as_ref()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_default()
}

#[op2(fast)]
fn op_set_rpc_port(state: &mut OpState, port: u16) {
    let runtime = get_runtime(state);
    let mut guard = runtime
        .state
        .context
        .write()
        .expect("runtime context lock poisoned");
    if guard.rpc_port.is_none() {
        guard.rpc_port = Some(port);
    }
}

#[op2]
fn op_get_rpc_port(state: &mut OpState) -> Option<u16> {
    get_runtime(state)
        .state
        .context
        .read()
        .expect("runtime context lock poisoned")
        .rpc_port
}

#[op2(fast)]
fn op_set_echo_server_port(state: &mut OpState, port: u16) {
    let runtime = get_runtime(state);
    let mut guard = runtime
        .state
        .context
        .write()
        .expect("runtime context lock poisoned");
    if guard.echo_server_port.is_none() {
        guard.echo_server_port = Some(port);
    }
}

#[op2(fast)]
fn op_set_mcp_server_port(state: &mut OpState, port: u16) {
    let runtime = get_runtime(state);
    let mut guard = runtime
        .state
        .context
        .write()
        .expect("runtime context lock poisoned");
    if guard.mcp_server_port.is_none() {
        guard.mcp_server_port = Some(port);
    }
}

#[op2]
#[string]
fn op_generate_cuid() -> String {
    cuid()
}

#[op2(fast)]
fn op_is_yasumu_ready(state: &mut OpState) -> bool {
    get_runtime(state)
        .state
        .context
        .read()
        .expect("runtime context lock poisoned")
        .ready
}

#[op2]
#[string]
fn op_get_yasumu_version(state: &mut OpState) -> String {
    get_runtime(state)
        .state
        .context
        .read()
        .expect("runtime context lock poisoned")
        .app_version
        .clone()
}

#[op2(fast)]
fn op_is_yasumu_dev_mode(state: &mut OpState) -> bool {
    get_runtime(state)
        .state
        .context
        .read()
        .expect("runtime context lock poisoned")
        .dev_mode
}

#[op2(fast)]
fn op_set_workspace_dir(state: &mut OpState, #[string] path: &str) {
    use std::path::PathBuf;
    let runtime = get_runtime(state);
    let mut guard = runtime
        .state
        .context
        .write()
        .expect("runtime context lock poisoned");
    guard.workspace_dir = if path.is_empty() {
        None
    } else {
        Some(PathBuf::from(path))
    };
}

#[op2]
#[string]
fn op_get_workspace_dir(state: &mut OpState) -> Option<String> {
    get_runtime(state)
        .state
        .context
        .read()
        .expect("runtime context lock poisoned")
        .workspace_dir
        .as_ref()
        .map(|p| p.to_string_lossy().into_owned())
}

#[op2]
#[string]
fn op_get_app_data_dir(state: &mut OpState) -> String {
    get_runtime(state)
        .state
        .context
        .read()
        .expect("runtime context lock poisoned")
        .app_data_dir
        .as_ref()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_default()
}

#[op2(fast)]
fn op_show_confirmation_dialog_sync(
    state: &mut OpState,
    #[string] title: &str,
    #[string] message: &str,
    #[string] yes_label: &str,
    #[string] no_label: &str,
    #[string] cancel_label: &str,
) -> bool {
    get_runtime(state)
        .host
        .confirm(title, message, yes_label, no_label, cancel_label)
}

deno_core::extension!(
    tanxium_rt,
    ops = [
        op_send_renderer_event,
        op_get_resources_dir,
        op_get_app_data_dir,
        op_set_rpc_port,
        op_generate_cuid,
        op_is_yasumu_ready,
        op_get_yasumu_version,
        op_set_echo_server_port,
        op_set_mcp_server_port,
        op_register_virtual_module,
        op_unregister_virtual_module,
        op_is_yasumu_dev_mode,
        op_get_rpc_port,
        op_unregister_all_virtual_modules,
        op_show_confirmation_dialog_sync,
        op_set_workspace_dir,
        op_get_workspace_dir,
    ],
    esm_entry_point = "ext:tanxium_rt/bootstrap.ts",
    esm = [
        dir "src/runtime",
        "bootstrap.ts",
        "ui.ts",
        "patches.ts",
        "utils.ts",
        "common.ts",
        "yasumu-request.ts",
        "yasumu-workspace-context.ts",
        "message-queue.ts",
        "modules/collection.ts",
    ],
    state = |state| {
        state.put::<deno_runtime::ops::bootstrap::SnapshotOptions>(
            deno_runtime::ops::bootstrap::SnapshotOptions::default(),
        );
        state.put::<sys_traits::impls::RealSys>(sys_traits::impls::RealSys);
    },
);
