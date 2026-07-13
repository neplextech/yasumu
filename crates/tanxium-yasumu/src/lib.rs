//! Tauri host adapter for the embeddable Tanxium runtime.
use std::sync::Arc;
use tanxium::{
    PermissionPromptResponse, RuntimeContext, RuntimeEvent, RuntimeHost, Tanxium,
    install_permission_prompter,
};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

pub struct TauriHost {
    app: AppHandle,
}

impl TauriHost {
    pub fn new(app: AppHandle) -> Arc<Self> {
        Arc::new(Self { app })
    }
}

impl RuntimeHost for TauriHost {
    fn emit_event(&self, event: RuntimeEvent) {
        if let RuntimeEvent::Renderer(payload) = event {
            let _ = self.app.emit("tanxium-event", payload);
        }
    }

    fn confirm(&self, title: &str, message: &str, yes: &str, no: &str, cancel: &str) -> bool {
        self.app
            .dialog()
            .message(message)
            .title(title)
            .kind(MessageDialogKind::Info)
            .buttons(MessageDialogButtons::YesNoCancelCustom(
                yes.into(),
                no.into(),
                cancel.into(),
            ))
            .blocking_show()
    }

    fn prompt_permission(
        &self,
        message: &str,
        name: &str,
        api_name: Option<&str>,
        is_unary: bool,
    ) -> PermissionPromptResponse {
        const MAX_PROMPT_LEN: usize = 10 * 1024;

        if message.len() > MAX_PROMPT_LEN {
            tracing::warn!(
                permission = name,
                length = message.len(),
                "rejecting an oversized permission prompt"
            );
            return PermissionPromptResponse::Deny;
        }

        let requested_by = api_name
            .map(|api| format!("\n\nRequested by: {api}"))
            .unwrap_or_default();
        let prompt_message =
            format!("Script requests --allow-{name} permission.\n\n{message}{requested_by}");

        if is_unary {
            return match self
                .app
                .dialog()
                .message(prompt_message)
                .title("Permission Request")
                .kind(MessageDialogKind::Warning)
                .buttons(MessageDialogButtons::YesNoCancelCustom(
                    "Allow All".into(),
                    "Allow".into(),
                    "Deny".into(),
                ))
                .blocking_show_with_result()
            {
                tauri_plugin_dialog::MessageDialogResult::Custom(label) if label == "Allow All" => {
                    PermissionPromptResponse::AllowAll
                }
                tauri_plugin_dialog::MessageDialogResult::Custom(label) if label == "Allow" => {
                    PermissionPromptResponse::Allow
                }
                _ => PermissionPromptResponse::Deny,
            };
        }

        if self
            .app
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
            PermissionPromptResponse::Allow
        } else {
            PermissionPromptResponse::Deny
        }
    }
}

#[derive(Clone)]
pub struct YasumuRuntime {
    runtime: Tanxium,
}

impl YasumuRuntime {
    pub fn start(app: AppHandle, entrypoint: impl AsRef<std::path::Path>) -> anyhow::Result<Self> {
        let context = RuntimeContext {
            app_version: app.package_info().version.to_string(),
            resource_dir: app.path().resource_dir().ok(),
            app_data_dir: app.path().app_data_dir().ok(),
            dev_mode: tauri::is_dev(),
            ..Default::default()
        };
        let host = TauriHost::new(app.clone());
        install_permission_prompter(host.clone());
        let runtime = Tanxium::builder()
            // Yasumu's main worker only runs its trusted bootstrap code. User
            // scripts run in web workers, which Tanxium always starts sandboxed.
            .allow_main_worker_all_permissions(true)
            .host(host)
            .build()?;
        *runtime
            .state()
            .context
            .write()
            .expect("runtime context lock poisoned") = context;
        runtime.run_file(entrypoint)?;
        Ok(Self { runtime })
    }

    pub fn send_event(&self, event: &str) {
        self.runtime.send_event(event);
    }

    pub fn set_ready(&self) {
        self.runtime
            .state()
            .context
            .write()
            .expect("runtime context lock poisoned")
            .ready = true;
    }

    pub fn rpc_port(&self) -> Option<u16> {
        self.runtime
            .state()
            .context
            .read()
            .expect("runtime context lock poisoned")
            .rpc_port
    }

    pub fn echo_server_port(&self) -> Option<u16> {
        self.runtime
            .state()
            .context
            .read()
            .expect("runtime context lock poisoned")
            .echo_server_port
    }

    pub fn mcp_server_port(&self) -> Option<u16> {
        self.runtime
            .state()
            .context
            .read()
            .expect("runtime context lock poisoned")
            .mcp_server_port
    }
}
