use crate::tanxium::state::{PERMISSION_CHANNELS, PermissionChannelPair};
use crate::tanxium::types::{PermissionPrompt, PermissionsResponse};
use crossbeam_channel::unbounded;
use deno_runtime::deno_permissions::prompter::{
    PermissionPrompter, PromptResponse, set_prompter,
};
use serde_json::json;
use std::cell::Cell;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::OnceLock;
use tauri::{AppHandle, Emitter};
use tracing::{debug, error, warn};

static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

static NEXT_THREAD_TOKEN: AtomicU64 = AtomicU64::new(1);

thread_local! {
    static THREAD_TOKEN: Cell<u64> = const { Cell::new(0) };
}

/// Returns a stable numeric token for the current thread, assigning one on first call.
fn current_thread_token() -> u64 {
    THREAD_TOKEN.with(|cell| {
        let val = cell.get();
        if val != 0 {
            return val;
        }
        let token = NEXT_THREAD_TOKEN.fetch_add(1, Ordering::Relaxed);
        cell.set(token);
        token
    })
}

pub fn set_app_handle(handle: AppHandle) {
    APP_HANDLE
        .set(handle)
        .unwrap_or_else(|_| error!("App handle was already set"));
}

/// Registers a permission channel for the current thread.
pub fn setup_permission_channel() {
    let token = current_thread_token();
    let (sender, receiver) = unbounded();
    PERMISSION_CHANNELS
        .lock()
        .expect("permission channels lock poisoned")
        .insert(token, PermissionChannelPair { sender, receiver });
}

/// Removes the permission channel for the current thread.
pub fn cleanup_permission_channel() {
    let token = current_thread_token();
    PERMISSION_CHANNELS
        .lock()
        .expect("permission channels lock poisoned")
        .remove(&token);
}

#[derive(Clone, serde::Serialize)]
struct PermissionPromptEvent {
    custom_id: String,
    thread_id: String,
    prompt: PermissionPrompt,
}

pub struct CustomPrompter;

impl PermissionPrompter for CustomPrompter {
    fn prompt(
        &mut self,
        message: &str,
        name: &str,
        api_name: Option<&str>,
        is_unary: bool,
        get_stack: Option<Box<dyn Fn() -> Vec<String> + Send + Sync + 'static>>,
    ) -> PromptResponse {
        const MAX_PROMPT_LEN: usize = 10 * 1024;

        if message.len() > MAX_PROMPT_LEN {
            warn!(
                "Permission prompt rejected: length {} exceeds max {}",
                message.len(),
                MAX_PROMPT_LEN
            );
            if let Some(handle) = APP_HANDLE.get() {
                let notification = json!({
                    "type": "show-notification",
                    "payload": {
                        "title": "Permission Prompt Rejected",
                        "message": format!(
                            "Prompt length ({} bytes) exceeds the maximum ({} bytes): request denied.\n\nThis may indicate an attempt to hide or bypass permission checks.",
                            message.len(),
                            MAX_PROMPT_LEN
                        ),
                        "variant": "warning"
                    }
                });
                if let Ok(s) = serde_json::to_string(&notification) {
                    let _ = handle.emit("tanxium-event", s);
                }
            }
            return PromptResponse::Deny;
        }

        let token = current_thread_token();
        let token_str = token.to_string();
        let custom_id = uuid::Uuid::new_v4().to_string();
        let stack = get_stack.map(|f| f()).unwrap_or_default();

        let prompt = PermissionPrompt {
            message: message.to_string(),
            name: name.to_string(),
            api_name: api_name.map(str::to_owned),
            is_unary,
            response: None,
            stack,
        };

        debug!(token, name, "Permission prompt requested");

        let receiver = {
            let guard = PERMISSION_CHANNELS
                .lock()
                .expect("permission channels lock poisoned");
            guard.get(&token).map(|pair| pair.receiver.clone())
        };

        let Some(receiver) = receiver else {
            warn!(token, "No permission channel registered for this thread");
            return PromptResponse::Deny;
        };

        if let Some(handle) = APP_HANDLE.get() {
            handle
                .emit(
                    "permission-prompt",
                    PermissionPromptEvent {
                        thread_id: token_str,
                        custom_id,
                        prompt,
                    },
                )
                .unwrap_or_else(|e| warn!("Failed to emit permission prompt: {}", e));
        }

        match receiver.recv() {
            Ok(response) => response.to_prompt_response(),
            Err(_) => {
                cleanup_permission_channel();
                PromptResponse::Deny
            }
        }
    }
}

pub fn respond_to_permission_prompt(token_str: &str, response: PermissionsResponse) {
    let Ok(token) = token_str.parse::<u64>() else {
        warn!("Failed to parse thread token: {}", token_str);
        return;
    };

    let sender = {
        let guard = PERMISSION_CHANNELS
            .lock()
            .expect("permission channels lock poisoned");
        guard.get(&token).map(|pair| pair.sender.clone())
    };

    let Some(sender) = sender else {
        warn!(token, "No permission channel found for token");
        return;
    };

    if let Err(crossbeam_channel::SendError(_)) = sender.send(response) {
        PERMISSION_CHANNELS
            .lock()
            .expect("permission channels lock poisoned")
            .remove(&token);
    }
}

pub fn initialize_prompter() {
    static INIT: std::sync::Once = std::sync::Once::new();
    INIT.call_once(|| set_prompter(Box::new(CustomPrompter)));
}
