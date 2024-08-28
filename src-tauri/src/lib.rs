use tauri::Manager;

mod commands;
mod tanxium;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_http::init())
        .manage(commands::smtp::ServerState::new())
        .manage(commands::workspace::WorkspaceState::new())
        .setup(|app| {
            let main_window = app.get_webview_window("main").unwrap();

            main_window.hide_menu().unwrap();
            main_window.maximize().unwrap();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::workspace::set_current_workspace,
            commands::workspace::get_current_workspace,
            commands::workspace::clear_current_workspace_session,
            commands::network::get_local_address,
            commands::smtp::is_smtp_server_running,
            commands::smtp::start_smtp_server,
            commands::smtp::stop_smtp_server,
            commands::smtp::get_emails,
            commands::smtp::clear_emails,
            commands::smtp::get_smtp_port,
            commands::smtp::get_unread_emails_count,
            commands::smtp::get_read_emails_count,
            commands::smtp::mark_all_as_unread,
            commands::smtp::mark_all_as_read,
            commands::smtp::mark_as_unread,
            commands::smtp::get_email,
            tanxium::evaluate_javascript
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
