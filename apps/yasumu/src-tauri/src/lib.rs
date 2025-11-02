mod tanxium;

use deno_runtime::deno_core::ModuleSpecifier;
use serde_json::json;
use std::sync::Mutex;
use tauri::Manager;

struct YasumuInternalState {
    ready: bool,
    rpc_port: Option<u16>,
}

#[tauri::command]
fn on_frontend_ready(app: tauri::AppHandle) -> Result<(), ()> {
    let state = app.state::<Mutex<YasumuInternalState>>();
    let mut yasumu_state = state.lock().unwrap();

    if !yasumu_state.ready {
        yasumu_state.ready = true;
        tanxium::invoke_renderer_event_callback(
            &json!(r#"{"type": "yasumu_internal_ready_event"}"#).to_string(),
        );
        Ok(())
    } else {
        Ok(())
    }
}

#[tauri::command]
fn respond_to_permission_prompt(thread_id: String, response: String) {
    tanxium::respond_to_permission_prompt(
        &thread_id,
        tanxium::PermissionsResponse::from_str(&response),
    );
}

#[tauri::command]
fn tanxium_send_event(data: &str) {
    tanxium::invoke_renderer_event_callback(data);
}

#[tauri::command]
fn get_rpc_port(app: tauri::AppHandle) -> Option<u16> {
    let state = app.state::<Mutex<YasumuInternalState>>();
    let yasumu_state = state.lock().unwrap();
    yasumu_state.rpc_port
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    rustls::crypto::ring::default_provider()
        .install_default()
        .expect("Failed to install rustls crypto provider");

    tauri::Builder::default()
        .manage(Mutex::new(YasumuInternalState {
            ready: false,
            rpc_port: None,
        }))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            tanxium::set_app_handle(app.handle().clone());
            tanxium::initialize_prompter();

            let app_handle = app.handle().clone();

            if let Ok(resource_dir) = app_handle.path().resource_dir() {
                let main_path = resource_dir.join("yasumu-internal").join("main.ts");
                println!("Looking for main module at: {}", main_path.display());

                if main_path.exists() {
                    println!("Main module file exists");
                    if let Ok(main_module) = ModuleSpecifier::from_file_path(&main_path) {
                        println!("Parsed main module: {}", main_module);
                        if let Err(e) =
                            tanxium::create_and_start_worker(&main_module, app_handle.clone())
                        {
                            eprintln!("Failed to initialize Deno worker: {}", e);
                        } else {
                            println!("Deno worker initialization started");
                        }
                    } else {
                        eprintln!(
                            "Failed to parse main module from path: {}",
                            main_path.display()
                        );
                    }
                } else {
                    eprintln!(
                        "Main module file does not exist at: {}",
                        main_path.display()
                    );
                }
            } else {
                eprintln!("Failed to get resource directory");
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            respond_to_permission_prompt,
            tanxium_send_event,
            on_frontend_ready,
            get_rpc_port,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
