// Partially based on https://github.com/carloslfu/tauri-deno-example/blob/5ee3c18d441357fbfca712cf998389ebb0025044/src-tauri/src/deno/mod.rs

#![allow(clippy::print_stdout)]
#![allow(clippy::print_stderr)]

mod module_loader;

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::Arc;
use std::sync::Mutex;
use std::thread;

use crossbeam_channel::{unbounded, Receiver, Sender};
use deno_runtime::deno_core::error::AnyError;
use deno_runtime::deno_core::op2;
use deno_runtime::deno_core::ModuleSpecifier;
use deno_runtime::deno_fs::RealFs;
use deno_runtime::deno_permissions::prompter::set_prompter;
use deno_runtime::deno_permissions::prompter::PermissionPrompter;
use deno_runtime::deno_permissions::prompter::PromptResponse;
use deno_runtime::deno_permissions::Permissions;
use deno_runtime::deno_permissions::PermissionsContainer;
use deno_runtime::permissions::RuntimePermissionDescriptorParser;
use deno_runtime::worker::MainWorker;
use deno_runtime::worker::WorkerOptions;
use deno_runtime::worker::WorkerServiceOptions;
use module_loader::TypescriptModuleLoader;
use once_cell::sync::Lazy;
use tauri::{AppHandle, Emitter};

// Task events channel for task state changes that will be received by Tauri
static TAURI_TASK_EVENTS: Lazy<(Sender<Task>, Receiver<Task>)> = Lazy::new(|| {
    let (tx, rx) = unbounded();
    (tx, rx)
});

// Store thread handles and their status
static THREAD_HANDLES: Lazy<Mutex<HashMap<String, std::thread::JoinHandle<Result<(), String>>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

// shutdown channel map
static SHUTDOWN_CHANNELS: Lazy<Mutex<HashMap<String, tokio::sync::oneshot::Sender<()>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

pub fn run_task(task_id: &str, code: &str) -> Result<(), String> {
    let code = code.to_string();

    let task_id = task_id.to_string();
    let task_id_clone = task_id.clone();

    let (stop_tx, stop_rx) = tokio::sync::oneshot::channel();

    SHUTDOWN_CHANNELS
        .lock()
        .unwrap()
        .insert(task_id.clone(), stop_tx);

    let handle = std::thread::spawn(move || {
        println!("Starting runtime");

        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .map_err(|e| e.to_string())?;

        println!("Starting async task");

        let _ = runtime.block_on(async {
            tokio::select! {
                _ = run(&task_id_clone, &code) => {},
                _ = stop_rx => {
                    println!("Task stopped");
                }
            }
        });

        println!("Runtime shutdown");

        // clean up
        SHUTDOWN_CHANNELS.lock().unwrap().remove(&task_id_clone);
        THREAD_HANDLES.lock().unwrap().remove(&task_id_clone);

        Ok(())
    });

    // Store the handle
    THREAD_HANDLES.lock().unwrap().insert(task_id, handle);

    Ok(())
}

pub fn stop_task(task_id: &str) -> Result<(), String> {
    let mut handles = THREAD_HANDLES.lock().unwrap();

    let task_id_clone = task_id.to_string();

    if let Some(handle) = handles.remove(&task_id_clone) {
        // Thread is already finished
        if handle.is_finished() {
            return Ok(());
        }

        // Attempt to stop the thread
        std::thread::spawn(move || {
            update_task_state(&task_id_clone, "stopping");

            // send shutdown message
            let result = SHUTDOWN_CHANNELS
                .lock()
                .unwrap()
                .remove(&task_id_clone)
                .unwrap()
                .send(());

            if result.is_err() {
                println!("Failed to send shutdown message");
            }

            // Wait for thread to complete
            match handle.join() {
                Ok(_) => {}
                Err(_) => {
                    println!("Failed to stop thread");
                }
            };

            update_task_state(&task_id_clone, "stopped");
        });
    }

    Ok(())
}

#[derive(Debug, Clone)]
pub enum PermissionsResponse {
    Allow,
    Deny,
    AllowAll,
}

impl PermissionsResponse {
    pub fn as_str(&self) -> &str {
        match self {
            PermissionsResponse::Allow => "Allow",
            PermissionsResponse::Deny => "Deny",
            PermissionsResponse::AllowAll => "AllowAll",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "Allow" => PermissionsResponse::Allow,
            "Deny" => PermissionsResponse::Deny,
            "AllowAll" => PermissionsResponse::AllowAll,
            _ => panic!("Invalid permissions response: {}", s),
        }
    }

    pub fn to_prompt_response(&self) -> PromptResponse {
        match self {
            PermissionsResponse::Allow => PromptResponse::Allow,
            PermissionsResponse::Deny => PromptResponse::Deny,
            PermissionsResponse::AllowAll => PromptResponse::AllowAll,
        }
    }
}

impl serde::Serialize for PermissionsResponse {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.as_str())
    }
}

impl<'de> serde::Deserialize<'de> for PermissionsResponse {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Ok(Self::from_str(&s))
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PermissionPrompt {
    message: String,
    name: String,
    api_name: Option<String>,
    is_unary: bool,
    response: Option<PermissionsResponse>,
}

static PERMISSION_CHANNELS: Lazy<Mutex<HashMap<thread::ThreadId, Sender<PermissionsResponse>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

static RECEIVER_MAP: Lazy<Mutex<HashMap<thread::ThreadId, Receiver<PermissionsResponse>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

static TASK_TO_THREAD_MAP: Lazy<Mutex<HashMap<String, thread::ThreadId>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

static THREAD_TO_TASK_MAP: Lazy<Mutex<HashMap<thread::ThreadId, String>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Task {
    id: String,
    state: String, // running, completed, error, stopping, stopped, waiting_for_permission
    error: String,
    return_value: String,
    permission_prompt: Option<PermissionPrompt>,
    permission_history: Vec<PermissionPrompt>,
}

impl Task {
    fn new(id: String, initial_state: String) -> Self {
        Self {
            id,
            state: initial_state,
            error: "".to_string(),
            return_value: "".to_string(),
            permission_prompt: None,
            permission_history: Vec::new(),
        }
    }
}

static TASK_STATE: Lazy<Mutex<HashMap<String, Task>>> = Lazy::new(|| Mutex::new(HashMap::new()));

#[op2(fast)]
fn return_value(#[string] task_id: &str, #[string] value: &str) {
    let mut state_lock = TASK_STATE.lock().unwrap();
    let task = state_lock.get_mut(task_id).unwrap();
    task.return_value = value.to_string();
}

#[op2]
#[string]
fn document_dir() -> Option<String> {
    dirs::document_dir().map(|path| path.to_string_lossy().to_string())
}

deno_core::extension!(
  runtime_extension,
  ops = [return_value, document_dir],
  esm_entry_point = "ext:runtime_extension/bootstrap.js",
  esm = [dir "src/tanxium", "bootstrap.js"]
);

pub fn init_listener(app_handle: AppHandle) {
    let app_handle_clone = app_handle.clone();

    // Use Tauri's existing runtime instead of creating a new one
    tauri::async_runtime::spawn(async move {
        while let Ok(task) = TAURI_TASK_EVENTS.1.recv() {
            let result = app_handle_clone.emit("task-state-changed", task);
            if result.is_err() {
                println!("Failed to emit task state changed");
            }
        }
    });
}

struct CustomPrompter;

impl CustomPrompter {
    fn register_receiver(thread_id: thread::ThreadId, receiver: Receiver<PermissionsResponse>) {
        RECEIVER_MAP.lock().unwrap().insert(thread_id, receiver);
    }

    fn remove_receiver(thread_id: &thread::ThreadId) {
        RECEIVER_MAP.lock().unwrap().remove(thread_id);
    }
}

impl PermissionPrompter for CustomPrompter {
    fn prompt(
        &mut self,
        message: &str,
        name: &str,
        api_name: Option<&str>,
        is_unary: bool,
        _: Option<Vec<deno_core::error::JsStackFrame>>, // stack frames
    ) -> PromptResponse {
        let thread_id = thread::current().id();
        let prompt = PermissionPrompt {
            message: message.to_string(),
            name: name.to_string(),
            api_name: api_name.map(|s| s.to_string()),
            is_unary,
            response: None,
        };

        println!("Prompting for permission: {:?}", prompt);

        let receiver = {
            let receiver_map = RECEIVER_MAP.lock().unwrap();
            receiver_map.get(&thread_id).cloned()
        };

        if let Some(receiver) = receiver {
            let mut state_lock = TASK_STATE.lock().unwrap();

            // Find task using thread_id
            let task_id = THREAD_TO_TASK_MAP.lock().unwrap().get(&thread_id).cloned();

            if let Some(task_id) = task_id {
                if let Some(task) = state_lock.get_mut(&task_id) {
                    println!("Found task --");

                    // Store as latest prompt
                    task.permission_prompt = Some(prompt.clone());
                    println!("Stored as latest prompt --");

                    // Add to history
                    task.permission_history.push(prompt);
                    println!("Added to history --");

                    drop(state_lock);

                    update_task_state(&task_id, "waiting_for_permission");
                    println!("Updated task state --");

                    println!("Waiting for response --");
                    match receiver.recv() {
                        Ok(response) => {
                            println!("Received response --");
                            update_task_state(&task_id, "running");
                            response.to_prompt_response()
                        }
                        Err(_) => {
                            update_task_state(&task_id, "error");
                            PromptResponse::Deny
                        }
                    }
                } else {
                    println!("No task found --");
                    PromptResponse::Deny
                }
            } else {
                println!("No task found --");
                PromptResponse::Deny
            }
        } else {
            println!("No receiver found for thread {:?}", thread_id);
            PromptResponse::Deny
        }
    }
}

pub async fn run(task_id: &str, code: &str) -> Result<(), AnyError> {
    // path of user directory
    let user_dir = dirs::home_dir().unwrap();

    // create code dir
    let code_dir = user_dir.join(".tauri_deno_example");
    std::fs::create_dir_all(&code_dir).unwrap();

    let temp_code_path = code_dir.join(format!("temp_code_{}.ts", task_id));

    println!("Writing code to {}", temp_code_path.display());

    let augmented_code = format!("globalThis.RuntimeExtension.taskId = \"{task_id}\";\n\n{code}");

    std::fs::write(&temp_code_path, augmented_code).unwrap();

    let main_module = ModuleSpecifier::from_file_path(&temp_code_path).unwrap();

    let fs = Arc::new(RealFs);
    let permission_desc_parser = Arc::new(RuntimePermissionDescriptorParser::new(fs.clone()));

    let source_map_store = Rc::new(RefCell::new(HashMap::new()));

    let permission_container =
        PermissionsContainer::new(permission_desc_parser, Permissions::none_with_prompt());

    // Create channel for permission prompts
    let (tx, rx) = unbounded();
    PERMISSION_CHANNELS
        .lock()
        .unwrap()
        .insert(thread::current().id(), tx);

    // Register the receiver with the global prompter
    CustomPrompter::register_receiver(thread::current().id(), rx);

    // Set the global prompter only once
    static PROMPTER_SET: std::sync::Once = std::sync::Once::new();
    PROMPTER_SET.call_once(|| {
        set_prompter(Box::new(CustomPrompter));
    });

    // Store task_id for current thread
    TASK_TO_THREAD_MAP
        .lock()
        .unwrap()
        .insert(task_id.to_string(), thread::current().id());

    // Store thread_id for current task
    THREAD_TO_TASK_MAP
        .lock()
        .unwrap()
        .insert(thread::current().id(), task_id.to_string());

    // Initialize task state
    TASK_STATE.lock().unwrap().insert(
        task_id.to_string(),
        Task::new(task_id.to_string(), "running".to_string()),
    );

    let mut worker = MainWorker::bootstrap_from_options(
        main_module.clone(),
        WorkerServiceOptions {
            module_loader: Rc::new(TypescriptModuleLoader {
                source_maps: source_map_store,
            }),
            // File only loader
            // module_loader: Rc::new(FsModuleLoader),
            permissions: permission_container,
            blob_store: Default::default(),
            broadcast_channel: Default::default(),
            feature_checker: Default::default(),
            node_services: Default::default(),
            npm_process_state_provider: Default::default(),
            root_cert_store_provider: Default::default(),
            shared_array_buffer_store: Default::default(),
            compiled_wasm_module_store: Default::default(),
            v8_code_cache: Default::default(),
            fetch_dns_resolver: Default::default(),
            fs,
        },
        WorkerOptions {
            extensions: vec![runtime_extension::init_ops_and_esm()],
            ..Default::default()
        },
    );

    let result = worker.execute_main_module(&main_module).await;
    if let Err(e) = result {
        let mut state_lock = TASK_STATE.lock().unwrap();
        let task = state_lock.get_mut(task_id).unwrap();
        task.state = "error".to_string();
        task.error = e.to_string();

        let task_clone = task.clone();
        drop(state_lock);

        emit_task_state_changed(task_clone);
        std::fs::remove_file(&temp_code_path).unwrap();

        return Ok(());
    }

    let result = worker.run_event_loop(false).await;

    if let Err(e) = result {
        let mut state_lock = TASK_STATE.lock().unwrap();
        let task = state_lock.get_mut(task_id).unwrap();
        task.state = "error".to_string();
        task.error = e.to_string();

        let task_clone = task.clone();
        drop(state_lock);

        emit_task_state_changed(task_clone);
        std::fs::remove_file(&temp_code_path).unwrap();

        return Ok(());
    }

    let mut state_lock = TASK_STATE.lock().unwrap();
    let task = state_lock.get_mut(task_id).unwrap();
    task.state = "completed".to_string();

    let task_clone = task.clone();
    drop(state_lock);

    std::fs::remove_file(&temp_code_path).unwrap();
    emit_task_state_changed(task_clone);

    // Clean up permission channel
    PERMISSION_CHANNELS
        .lock()
        .unwrap()
        .remove(&thread::current().id());

    // Clean up at the end
    CustomPrompter::remove_receiver(&thread::current().id());
    PERMISSION_CHANNELS
        .lock()
        .unwrap()
        .remove(&thread::current().id());
    TASK_TO_THREAD_MAP
        .lock()
        .unwrap()
        .remove(&task_id.to_string());
    THREAD_TO_TASK_MAP
        .lock()
        .unwrap()
        .remove(&thread::current().id());

    Ok(())
}

pub fn get_task_state(task_id: &str) -> Option<Task> {
    TASK_STATE.lock().unwrap().get(task_id).cloned()
}

pub fn clear_completed_tasks() {
    let mut state_lock = TASK_STATE.lock().unwrap();
    state_lock.retain(|_, task| {
        task.state == "running"
            || task.state == "stopping"
            || task.state == "waiting_for_permission"
    });
}

pub fn update_task_state(task_id: &str, state: &str) {
    println!("Updating task state --");
    let mut state_lock = TASK_STATE.lock().unwrap();
    println!("Got state lock --");

    let task = state_lock.get_mut(task_id).unwrap();
    println!("Got task --");

    task.state = state.to_string();
    println!("Updated task state --");
    let task_clone = task.clone();
    drop(state_lock);

    emit_task_state_changed(task_clone);
    println!("Emitted task state changed --");
}

fn emit_task_state_changed(task: Task) {
    println!("Emitting task state changed --");
    let result = TAURI_TASK_EVENTS.0.send(task);
    if result.is_err() {
        println!("Failed to send task state changed");
    }
    println!("Emitted task state changed --");
}

pub fn respond_to_permission_prompt(task_id: &str, response: PermissionsResponse) {
    println!("Responding to permission prompt --");

    let thread_id = TASK_TO_THREAD_MAP.lock().unwrap().get(task_id).cloned();

    if let Some(thread_id) = thread_id {
        if let Some(tx) = PERMISSION_CHANNELS.lock().unwrap().get(&thread_id) {
            println!("Got permission channel --");
            let mut state_lock = TASK_STATE.lock().unwrap();
            println!("Got state lock --");

            if let Some(task) = state_lock.get_mut(task_id) {
                println!("Got task --");
                // Update the latest prompt with the response
                if let Some(prompt) = &mut task.permission_prompt {
                    prompt.response = Some(response.clone());
                }

                // Update the permission history
                if let Some(last) = task.permission_history.last_mut() {
                    last.response = Some(response.clone());
                }

                println!("Updated task --");
            }

            drop(state_lock);
            println!("Dropped state lock --");

            let _ = tx.send(response);
            println!("Sent response --");
        } else {
            println!("No permission channel found --");
        }
    } else {
        println!("No thread found for task_id: {} --", task_id);
    }
}
