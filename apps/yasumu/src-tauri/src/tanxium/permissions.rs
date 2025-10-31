use crate::tanxium::state::{PERMISSION_CHANNELS, RECEIVER_MAP};
use crate::tanxium::types::{PermissionPrompt, PermissionsResponse};
use crossbeam_channel::unbounded;
use deno_runtime::deno_permissions::prompter::set_prompter;
use deno_runtime::deno_permissions::prompter::PermissionPrompter;
use deno_runtime::deno_permissions::prompter::PromptResponse;
use serde_json::json;
use std::thread;
use tauri::{AppHandle, Emitter};

static APP_HANDLE: once_cell::sync::Lazy<std::sync::Mutex<Option<AppHandle>>> =
    once_cell::sync::Lazy::new(|| std::sync::Mutex::new(None));

pub fn set_app_handle(app_handle: AppHandle) {
    *APP_HANDLE.lock().unwrap() = Some(app_handle);
}

pub struct CustomPrompter;

pub fn setup_permission_channel(thread_id: thread::ThreadId) {
    let (tx, rx) = unbounded();
    PERMISSION_CHANNELS.lock().unwrap().insert(thread_id, tx);
    RECEIVER_MAP.lock().unwrap().insert(thread_id, rx);
}

pub fn cleanup_permission_channel(thread_id: &thread::ThreadId) {
    PERMISSION_CHANNELS.lock().unwrap().remove(thread_id);
    RECEIVER_MAP.lock().unwrap().remove(thread_id);
}

#[derive(Clone, serde::Serialize)]
struct PermissionPromptEvent {
    custom_id: String,
    thread_id: String,
    prompt: PermissionPrompt,
}

impl PermissionPrompter for CustomPrompter {
    fn prompt(
        &mut self,
        message: &str,
        name: &str,
        api_name: Option<&str>,
        is_unary: bool,
        get_stack: Option<Box<dyn Fn() -> Vec<String> + Send + Sync + 'static>>,
    ) -> PromptResponse {
        const MAX_PERMISSION_PROMPT_LENGTH: usize = 10 * 1024;

        if message.len() > MAX_PERMISSION_PROMPT_LENGTH {
            let notification = json!({
                "type": "show-notification",
                "payload": {
                    "title": "Permission Prompt Rejected",
                    "message": format!(
                        "Permission prompt length ({} bytes) was larger than the configured maximum length ({} bytes): denying request.\n\nWARNING: This may indicate that code is trying to bypass or hide permission check requests.",
                        message.len(),
                        MAX_PERMISSION_PROMPT_LENGTH
                    ),
                    "variant": "warning"
                }
            });

            if let Some(app_handle) = APP_HANDLE.lock().unwrap().as_ref() {
                if let Ok(json_string) = serde_json::to_string(&notification) {
                    let _ = app_handle.emit("tanxium-event", json_string);
                }
            }

            return PromptResponse::Deny;
        }

        let thread_id = thread::current().id();
        let thread_id_str = format!("{:?}", thread_id);
        let custom_id = uuid::Uuid::new_v4().to_string();
        let stack = get_stack.map(|f| f()).unwrap_or_default();

        let prompt = PermissionPrompt {
            message: message.to_string(),
            name: name.to_string(),
            api_name: api_name.map(|s| s.to_string()),
            is_unary,
            response: None,
            stack,
        };

        println!("Prompting for permission: {:?}", prompt);

        let receiver = {
            let receiver_map = RECEIVER_MAP.lock().unwrap();
            receiver_map.get(&thread_id).cloned()
        };

        if let Some(receiver) = receiver {
            if let Some(app_handle) = APP_HANDLE.lock().unwrap().as_ref() {
                app_handle
                    .emit(
                        "permission-prompt",
                        PermissionPromptEvent {
                            thread_id: thread_id_str.clone(),
                            prompt: prompt.clone(),
                            custom_id: custom_id.clone(),
                        },
                    )
                    .unwrap_or_else(|e| {
                        println!("Failed to emit permission prompt: {}", e);
                    });
            }

            match receiver.recv() {
                Ok(response) => response.to_prompt_response(),
                Err(_) => PromptResponse::Deny,
            }
        } else {
            PromptResponse::Deny
        }
    }
}

pub fn respond_to_permission_prompt(thread_id_str: &str, response: PermissionsResponse) {
    let thread_id = parse_thread_id(thread_id_str);

    if let Some(thread_id) = thread_id {
        if let Some(tx) = PERMISSION_CHANNELS.lock().unwrap().get(&thread_id).cloned() {
            let _ = tx.send(response);
        } else {
            println!(
                "No permission channel found for thread_id: {}",
                thread_id_str
            );
        }
    } else {
        println!("Failed to parse thread_id: {}", thread_id_str);
    }
}

fn parse_thread_id(thread_id_str: &str) -> Option<thread::ThreadId> {
    let thread_id_str = thread_id_str.trim();

    if thread_id_str.starts_with("ThreadId(") && thread_id_str.ends_with(")") {
        let inner = &thread_id_str[9..thread_id_str.len() - 1];
        if let Ok(val) = u64::from_str_radix(inner, 16) {
            unsafe {
                return Some(std::mem::transmute::<u64, thread::ThreadId>(val));
            }
        }
        if let Ok(val) = inner.parse::<u64>() {
            unsafe {
                return Some(std::mem::transmute::<u64, thread::ThreadId>(val));
            }
        }
    }

    None
}

pub fn initialize_prompter() {
    static PROMPTER_SET: std::sync::Once = std::sync::Once::new();
    PROMPTER_SET.call_once(|| {
        set_prompter(Box::new(CustomPrompter));
    });
}
