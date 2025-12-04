use crate::tanxium::state::get_renderer_event_sender;
use crate::tanxium::types::AppHandleState;
use crate::YasumuInternalState;
use cuid2::cuid;
use deno_core::op2;
use deno_core::OpState;
use serde_json::json;
use std::sync::Mutex;
use tauri::Emitter;
use tauri::Manager;

#[op2(fast)]
fn op_send_renderer_event(state: &mut OpState, #[string] event: &str) {
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };
    app_handle.emit("tanxium-event", event).unwrap();
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

deno_core::extension!(
    tanxium_rt,
    ops = [
        op_send_renderer_event,
        op_get_resources_dir,
        op_set_rpc_port,
        op_generate_cuid,
        op_is_yasumu_ready,
        op_get_yasumu_version,
    ],
    esm_entry_point = "ext:tanxium_rt/bootstrap.ts",
    esm = [
        dir "src/tanxium/runtime",
        "bootstrap.ts",
        "ui.ts",
        "patches.ts",
        "utils.ts",
        "common.ts",
    ],
    state = |state| {
        state.put::<deno_runtime::ops::bootstrap::SnapshotOptions>(
            deno_runtime::ops::bootstrap::SnapshotOptions::default(),
        );
        state.put::<sys_traits::impls::RealSys>(sys_traits::impls::RealSys::default());
    },
);
