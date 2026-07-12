use crate::state::YasumuInternalState;
use crate::tanxium::state::get_renderer_event_sender;
use crate::tanxium::types::AppHandleState;
use cuid2::cuid;
use deno_core::{op2, OpState};
use std::sync::RwLock;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tracing::error;

#[inline]
fn get_app_handle(state: &OpState) -> AppHandle {
    state.borrow::<AppHandleState>().app_handle.clone()
}

#[op2(fast)]
fn op_send_renderer_event(state: &mut OpState, #[string] event: &str) {
    let app_handle = get_app_handle(state);
    if let Err(e) = app_handle.emit("tanxium-event", event) {
        error!("Failed to emit tanxium-event: {}", e);
    }
}

#[op2(fast)]
fn op_register_virtual_module(state: &mut OpState, #[string] key: &str, #[string] code: &str) {
    let app_handle = get_app_handle(state);
    let virtual_modules = {
        let app_state = app_handle.state::<RwLock<YasumuInternalState>>();
        let guard = app_state.read().expect("state lock poisoned");
        guard.virtual_modules.clone()
    };
    virtual_modules
        .lock()
        .expect("virtual modules lock poisoned")
        .insert(key.to_string(), code.to_string());
}

#[op2(fast)]
fn op_unregister_virtual_module(state: &mut OpState, #[string] key: &str) {
    let app_handle = get_app_handle(state);
    let virtual_modules = {
        let app_state = app_handle.state::<RwLock<YasumuInternalState>>();
        let guard = app_state.read().expect("state lock poisoned");
        guard.virtual_modules.clone()
    };
    virtual_modules
        .lock()
        .expect("virtual modules lock poisoned")
        .remove(key);
}

#[op2(fast)]
fn op_unregister_all_virtual_modules(state: &mut OpState) {
    let app_handle = get_app_handle(state);
    let virtual_modules = {
        let app_state = app_handle.state::<RwLock<YasumuInternalState>>();
        let guard = app_state.read().expect("state lock poisoned");
        guard.virtual_modules.clone()
    };
    virtual_modules
        .lock()
        .expect("virtual modules lock poisoned")
        .clear();
}

#[op2]
#[string]
fn op_get_resources_dir(state: &mut OpState) -> String {
    let app_handle = get_app_handle(state);
    match app_handle.path().resource_dir() {
        Ok(path) => path.to_string_lossy().into_owned(),
        Err(e) => {
            error!("Failed to get resource directory: {}", e);
            String::new()
        }
    }
}

#[op2(fast)]
fn op_set_rpc_port(state: &mut OpState, port: u16) {
    let app_handle = get_app_handle(state);
    let app_state = app_handle.state::<RwLock<YasumuInternalState>>();
    let mut guard = app_state.write().expect("state lock poisoned");
    if guard.rpc_port.is_none() {
        guard.rpc_port = Some(port);
    }
}

#[op2]
fn op_get_rpc_port(state: &mut OpState) -> Option<u16> {
    let app_handle = get_app_handle(state);
    app_handle
        .state::<RwLock<YasumuInternalState>>()
        .read()
        .expect("state lock poisoned")
        .rpc_port
}

#[op2(fast)]
fn op_set_echo_server_port(state: &mut OpState, port: u16) {
    let app_handle = get_app_handle(state);
    let app_state = app_handle.state::<RwLock<YasumuInternalState>>();
    let mut guard = app_state.write().expect("state lock poisoned");
    if guard.echo_server_port.is_none() {
        guard.echo_server_port = Some(port);
    }
}

#[op2(fast)]
fn op_set_mcp_server_port(state: &mut OpState, port: u16) {
    let app_handle = get_app_handle(state);
    let app_state = app_handle.state::<RwLock<YasumuInternalState>>();
    let mut guard = app_state.write().expect("state lock poisoned");
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
    let app_handle = get_app_handle(state);
    app_handle
        .state::<RwLock<YasumuInternalState>>()
        .read()
        .expect("state lock poisoned")
        .ready
}

#[op2]
#[string]
fn op_get_yasumu_version(state: &mut OpState) -> String {
    get_app_handle(state).package_info().version.to_string()
}

pub fn invoke_renderer_event_callback(event: &str) {
    if let Some(sender) = get_renderer_event_sender() {
        let _ = sender.send(event.to_string());
    } else {
        error!("No renderer event sender available");
    }
}

#[op2(fast)]
fn op_is_yasumu_dev_mode() -> bool {
    tauri::is_dev()
}

#[op2(fast)]
fn op_set_workspace_dir(state: &mut OpState, #[string] path: &str) {
    use std::path::PathBuf;
    let app_handle = get_app_handle(state);
    let app_state = app_handle.state::<RwLock<YasumuInternalState>>();
    let mut guard = app_state.write().expect("state lock poisoned");
    guard.workspace_dir = if path.is_empty() {
        None
    } else {
        Some(PathBuf::from(path))
    };
}

#[op2]
#[string]
fn op_get_workspace_dir(state: &mut OpState) -> Option<String> {
    let app_handle = get_app_handle(state);
    app_handle
        .state::<RwLock<YasumuInternalState>>()
        .read()
        .expect("state lock poisoned")
        .workspace_dir
        .as_ref()
        .map(|p| p.to_string_lossy().into_owned())
}

#[op2]
#[string]
fn op_get_app_data_dir(state: &mut OpState) -> String {
    let app_handle = get_app_handle(state);
    match app_handle.path().app_data_dir() {
        Ok(path) => path.to_string_lossy().into_owned(),
        Err(e) => {
            error!("Failed to get app data directory: {}", e);
            String::new()
        }
    }
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
    get_app_handle(state)
        .dialog()
        .message(message)
        .kind(MessageDialogKind::Info)
        .title(title)
        .buttons(MessageDialogButtons::YesNoCancelCustom(
            yes_label.to_string(),
            no_label.to_string(),
            cancel_label.to_string(),
        ))
        .blocking_show()
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
        dir "src/tanxium/runtime",
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
