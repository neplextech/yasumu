use crate::state::YasumuInternalState;
use crate::tanxium;
use serde_json::json;
use std::sync::RwLock;
use tauri::{AppHandle, Manager};
use tracing::info;

#[tauri::command]
pub fn on_frontend_ready(app: AppHandle) -> Result<(), ()> {
    info!("Yasumu frontend is ready");

    let app_state = app.state::<RwLock<YasumuInternalState>>();
    let already_ready = {
        let mut guard = app_state.write().expect("state lock poisoned");
        if guard.ready {
            true
        } else {
            guard.ready = true;
            false
        }
    };

    if !already_ready {
        tanxium::invoke_renderer_event_callback(
            &json!(r#"{"type": "yasumu_internal_ready_event"}"#).to_string(),
        );
    }

    Ok(())
}

#[tauri::command]
pub fn tanxium_send_event(data: &str) {
    tanxium::invoke_renderer_event_callback(data);
}

#[tauri::command]
pub fn get_rpc_port(app: AppHandle) -> Option<u16> {
    app.state::<RwLock<YasumuInternalState>>()
        .read()
        .expect("state lock poisoned")
        .rpc_port
}

#[tauri::command]
pub fn get_echo_server_port(app: AppHandle) -> Option<u16> {
    app.state::<RwLock<YasumuInternalState>>()
        .read()
        .expect("state lock poisoned")
        .echo_server_port
}

#[tauri::command]
pub fn get_mcp_server_port(app: AppHandle) -> Option<u16> {
    app.state::<RwLock<YasumuInternalState>>()
        .read()
        .expect("state lock poisoned")
        .mcp_server_port
}

#[tauri::command]
pub fn yasumu_open_devtools(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_devtools_open() {
            window.close_devtools();
        } else {
            window.open_devtools();
        }
    }
}
