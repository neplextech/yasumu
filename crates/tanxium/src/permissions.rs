//! Permission prompting adapters for embedded Tanxium runtimes.

use std::sync::Arc;

use deno_runtime::deno_permissions::prompter::{
    GetFormattedStackFn, PermissionPrompter, PromptResponse, set_prompter,
};

use crate::{PermissionPromptResponse, RuntimeHost};

/// Installs a process-wide Deno permission prompter backed by a Tanxium host.
///
/// Deno permission prompts are process-global. Embedders with a graphical UI
/// should call this once during startup so scripts running in web workers can
/// request permissions through their native dialog instead of a terminal.
pub fn install_permission_prompter(host: Arc<dyn RuntimeHost>) {
    set_prompter(Box::new(HostPermissionPrompter { host }));
}

struct HostPermissionPrompter {
    host: Arc<dyn RuntimeHost>,
}

impl PermissionPrompter for HostPermissionPrompter {
    fn prompt(
        &mut self,
        message: &str,
        name: &str,
        api_name: Option<&str>,
        is_unary: bool,
        _get_stack: Option<GetFormattedStackFn>,
    ) -> PromptResponse {
        match self
            .host
            .prompt_permission(message, name, api_name, is_unary)
        {
            PermissionPromptResponse::Allow => PromptResponse::Allow,
            PermissionPromptResponse::AllowAll => PromptResponse::AllowAll,
            PermissionPromptResponse::Deny => PromptResponse::Deny,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct AllowingHost;

    impl RuntimeHost for AllowingHost {
        fn emit_event(&self, _event: crate::RuntimeEvent) {}

        fn prompt_permission(
            &self,
            message: &str,
            name: &str,
            api_name: Option<&str>,
            is_unary: bool,
        ) -> PermissionPromptResponse {
            assert!(message.contains("ETHEREAL_API"));
            assert_eq!(name, "env");
            assert_eq!(api_name, Some("Deno.env.get"));
            assert!(is_unary);
            PermissionPromptResponse::AllowAll
        }
    }

    #[test]
    fn host_prompter_grants_an_approved_request() {
        let mut prompter = HostPermissionPrompter {
            host: Arc::new(AllowingHost),
        };

        assert_eq!(
            prompter.prompt(
                "Requires env access to \"ETHEREAL_API\"",
                "env",
                Some("Deno.env.get"),
                true,
                None,
            ),
            PromptResponse::AllowAll
        );
    }
}
