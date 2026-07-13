use deno_runtime::deno_permissions::prompter::{PermissionPrompter, PromptResponse, set_prompter};
use std::sync::OnceLock;
use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tracing::{error, warn};

static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

pub fn set_app_handle(handle: AppHandle) {
    APP_HANDLE
        .set(handle)
        .unwrap_or_else(|_| error!("App handle was already set"));
}

pub struct CustomPrompter;

impl PermissionPrompter for CustomPrompter {
    fn prompt(
        &mut self,
        message: &str,
        name: &str,
        api_name: Option<&str>,
        is_unary: bool,
        _get_stack: Option<Box<dyn Fn() -> Vec<String> + Send + Sync + 'static>>,
    ) -> PromptResponse {
        const MAX_PROMPT_LEN: usize = 10 * 1024;

        if message.len() > MAX_PROMPT_LEN {
            warn!(
                "Permission prompt rejected: length {} exceeds max {}",
                message.len(),
                MAX_PROMPT_LEN
            );
            return PromptResponse::Deny;
        }

        let Some(handle) = APP_HANDLE.get() else {
            warn!(
                name,
                "Permission prompt rejected because the app handle is unavailable"
            );
            return PromptResponse::Deny;
        };

        let requested_by = api_name
            .map(|api| format!("\n\nRequested by: {api}"))
            .unwrap_or_default();
        let prompt_message =
            format!("Script requests --allow-{name} permission.\n\n{message}{requested_by}");

        if is_unary {
            let result = handle
                .dialog()
                .message(prompt_message)
                .title("Permission Request")
                .kind(MessageDialogKind::Warning)
                .buttons(MessageDialogButtons::YesNoCancelCustom(
                    "Allow all".into(),
                    "Allow".into(),
                    "Deny".into(),
                ))
                .blocking_show_with_result();

            return match result {
                tauri_plugin_dialog::MessageDialogResult::Custom(label) if label == "Allow all" => {
                    PromptResponse::AllowAll
                }
                tauri_plugin_dialog::MessageDialogResult::Custom(label) if label == "Allow" => {
                    PromptResponse::Allow
                }
                _ => PromptResponse::Deny,
            };
        }

        if handle
            .dialog()
            .message(prompt_message)
            .title("Permission Request")
            .kind(MessageDialogKind::Warning)
            .buttons(MessageDialogButtons::OkCancelCustom(
                "Allow".into(),
                "Deny".into(),
            ))
            .blocking_show()
        {
            PromptResponse::Allow
        } else {
            PromptResponse::Deny
        }
    }
}

pub fn initialize_prompter() {
    static INIT: std::sync::Once = std::sync::Once::new();
    INIT.call_once(|| set_prompter(Box::new(CustomPrompter)));
}
