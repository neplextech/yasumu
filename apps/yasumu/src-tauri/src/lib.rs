mod commands;
mod state;
mod tanxium;

use deno_runtime::deno_core::ModuleSpecifier;
use state::YasumuInternalState;
use std::sync::RwLock;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use tracing::{error, info};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .try_init();

    rustls::crypto::ring::default_provider()
        .install_default()
        .expect("Failed to install rustls crypto provider");

    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .manage(RwLock::new(YasumuInternalState::new()))
        .setup(move |app| {
            let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("Yasumu")
                .inner_size(1280.0, 720.0);

            #[cfg(target_os = "macos")]
            let win_builder = win_builder
                .title_bar_style(tauri::TitleBarStyle::Overlay)
                .hidden_title(true);

            #[cfg(not(target_os = "macos"))]
            let win_builder = win_builder.decorations(false);

            let window = win_builder.build()?;

            tanxium::set_app_handle(app.handle().clone());
            tanxium::initialize_prompter();

            #[cfg(debug_assertions)]
            window.open_devtools();

            let app_handle = app.handle().clone();

            match app_handle.path().resource_dir() {
                Ok(resource_dir) => {
                    let main_path = resource_dir
                        .join("resources")
                        .join("yasumu-scripts")
                        .join("main.ts");

                    info!("Looking for main module at: {}", main_path.display());

                    if !main_path.exists() {
                        error!("Main module does not exist at: {}", main_path.display());
                        return Ok(());
                    }

                    match ModuleSpecifier::from_file_path(&main_path) {
                        Ok(main_module) => {
                            info!("Starting worker for: {}", main_module);
                            if let Err(e) =
                                tanxium::create_and_start_worker(&main_module, app_handle)
                            {
                                error!("Failed to initialize Deno worker: {}", e);
                            }
                        }
                        Err(()) => {
                            error!(
                                "Failed to parse module specifier from: {}",
                                main_path.display()
                            );
                        }
                    }
                }
                Err(e) => error!("Failed to get resource directory: {}", e),
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::tanxium_send_event,
            commands::on_frontend_ready,
            commands::get_rpc_port,
            commands::get_echo_server_port,
            commands::get_mcp_server_port,
            commands::yasumu_open_devtools,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
