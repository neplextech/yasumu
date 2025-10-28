mod tanxium;

#[tauri::command]
fn run_task(task_id: &str, code: &str) -> Result<(), String> {
    tanxium::run_task(task_id, code)
}

#[tauri::command]
fn stop_task(task_id: &str) -> Result<(), String> {
    tanxium::stop_task(task_id)
}

#[tauri::command]
fn get_task_state(task_id: String) -> Result<tanxium::Task, String> {
    let Some(task_state) = tanxium::get_task_state(&task_id) else {
        return Err("Task not found".to_string());
    };

    Ok(task_state)
}

#[tauri::command]
fn clear_completed_tasks() {
    tanxium::clear_completed_tasks();
}

#[tauri::command]
fn respond_to_permission_prompt(task_id: String, response: String) {
    tanxium::respond_to_permission_prompt(
        &task_id,
        tanxium::PermissionsResponse::from_str(&response),
    );
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize rustls crypto provider
    rustls::crypto::ring::default_provider()
        .install_default()
        .expect("Failed to install rustls crypto provider");

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            tanxium::init_listener(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            run_task,
            stop_task,
            get_task_state,
            clear_completed_tasks,
            respond_to_permission_prompt,
            greet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
