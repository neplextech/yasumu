use crate::YasumuInternalState;
use crate::tanxium::state::get_renderer_event_sender;
use crate::tanxium::types::AppHandleState;
use cuid2::cuid;
use deno_core::OpState;
use deno_core::op2;
use std::sync::Mutex;
use tauri::Emitter;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_dialog::MessageDialogButtons;
use tauri_plugin_dialog::MessageDialogKind;

#[op2(fast)]
fn op_send_renderer_event(state: &mut OpState, #[string] event: &str) {
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };
    app_handle.emit("tanxium-event", event).unwrap();
}

#[op2(fast)]
fn op_register_virtual_module(state: &mut OpState, #[string] key: &str, #[string] code: &str) {
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };
    let yasumu_state = app_handle.state::<Mutex<YasumuInternalState>>();
    let guard = yasumu_state.lock().unwrap();
    let mut virtual_modules = guard.virtual_modules.lock().unwrap();
    virtual_modules.insert(key.to_string(), code.to_string());
}

#[op2(fast)]
fn op_unregister_virtual_module(state: &mut OpState, #[string] key: &str) {
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };
    let yasumu_state = app_handle.state::<Mutex<YasumuInternalState>>();
    let guard = yasumu_state.lock().unwrap();
    let mut virtual_modules = guard.virtual_modules.lock().unwrap();
    virtual_modules.remove(key);
}

#[op2(fast)]
fn op_unregister_all_virtual_modules(state: &mut OpState) {
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };
    let yasumu_state = app_handle.state::<Mutex<YasumuInternalState>>();
    let guard = yasumu_state.lock().unwrap();
    let mut virtual_modules = guard.virtual_modules.lock().unwrap();
    virtual_modules.clear();
}

#[op2]
#[string]
fn op_get_resources_dir(state: &mut OpState) -> String {
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };
    let path_str = app_handle.path().resource_dir().unwrap();
    let path_str = path_str.as_path().to_str();

    if path_str.is_none() {
        eprintln!("Failed to get resources directory");
        return "".to_string();
    }

    path_str.unwrap().to_string()
}

#[op2(fast)]
fn op_set_rpc_port(state: &mut OpState, port: u16) {
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };
    let state = app_handle.state::<Mutex<YasumuInternalState>>();
    let mut yasumu_state = state.lock().unwrap();

    // only set the RPC port if it is not already set
    // this is to prevent the RPC port from being set multiple times
    if yasumu_state.rpc_port.is_none() {
        yasumu_state.rpc_port = Some(port);
    }
}

#[op2]
fn op_get_rpc_port(state: &mut OpState) -> Option<u16> {
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };
    let state = app_handle.state::<Mutex<YasumuInternalState>>();
    let yasumu_state = state.lock().unwrap();
    yasumu_state.rpc_port
}

#[op2(fast)]
fn op_set_echo_server_port(state: &mut OpState, port: u16) {
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };
    let state = app_handle.state::<Mutex<YasumuInternalState>>();
    let mut yasumu_state = state.lock().unwrap();

    // only set the echo server port if it is not already set
    // this is to prevent the echo server port from being set multiple times
    if yasumu_state.echo_server_port.is_none() {
        yasumu_state.echo_server_port = Some(port);
    }
}

#[op2]
#[string]
fn op_generate_cuid() -> String {
    cuid()
}

#[op2(fast)]
fn op_is_yasumu_ready(state: &mut OpState) -> bool {
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };
    let state = app_handle.state::<Mutex<YasumuInternalState>>();
    let yasumu_state = state.lock().unwrap();
    yasumu_state.ready
}

#[op2]
#[string]
fn op_get_yasumu_version(state: &mut OpState) -> String {
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };
    app_handle.package_info().version.to_string()
}

pub fn invoke_renderer_event_callback(event: &str) {
    if let Some(sender) = get_renderer_event_sender() {
        let _ = sender.send(event.to_string());
    } else {
        eprintln!("No renderer event sender available");
    }
}

#[op2(fast)]
fn op_is_yasumu_dev_mode() -> bool {
    tauri::is_dev()
}

#[op2]
#[string]
fn op_get_app_data_dir(state: &mut OpState) -> String {
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };
    let path = app_handle.path().app_data_dir().unwrap();
    let path_str = path.as_path().to_str();

    if path_str.is_none() {
        eprintln!("Failed to get app data directory");
        return "".to_string();
    }

    path_str.unwrap().to_string()
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
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };

    let result = app_handle
        .dialog()
        .message(message)
        .kind(MessageDialogKind::Info)
        .title(title)
        .buttons(MessageDialogButtons::YesNoCancelCustom(
            yes_label.to_string(),
            no_label.to_string(),
            cancel_label.to_string(),
        ))
        .blocking_show();

    result
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
        op_register_virtual_module,
        op_unregister_virtual_module,
        op_is_yasumu_dev_mode,
        op_get_rpc_port,
        op_unregister_all_virtual_modules,
        op_show_confirmation_dialog_sync,
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
        state.put::<sys_traits::impls::RealSys>(sys_traits::impls::RealSys::default());
    },
);
