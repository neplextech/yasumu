//! Terminal implementation of Tanxium host events.

use std::io::{self, IsTerminal, Write};

use tanxium::{PermissionPromptResponse, RuntimeEvent, RuntimeHost};

/// Sends failures to standard error and, when enabled, renderer events to standard output.
pub struct TerminalHost {
    verbose: bool,
}

impl TerminalHost {
    /// Creates a terminal host with optional renderer-event output.
    pub fn new(verbose: bool) -> Self {
        Self { verbose }
    }
}

impl RuntimeHost for TerminalHost {
    fn emit_event(&self, event: RuntimeEvent) {
        match event {
            RuntimeEvent::Renderer(event) if self.verbose => println!("{event}"),
            RuntimeEvent::Renderer(_) => {}
            RuntimeEvent::Failure(error) => eprintln!("Tanxium runtime failure: {error}"),
        }
    }

    fn prompt_permission(
        &self,
        message: &str,
        name: &str,
        api_name: Option<&str>,
        is_unary: bool,
    ) -> PermissionPromptResponse {
        if !io::stdin().is_terminal() {
            eprintln!(
                "Tanxium denied --allow-{name}: standard input is not interactive. \
                 Re-run with --no-sandbox or grant permission interactively."
            );
            return PermissionPromptResponse::Deny;
        }

        eprintln!("\nPermission request: --allow-{name}");
        eprintln!("{message}");
        if let Some(api_name) = api_name {
            eprintln!("Requested by: {api_name}");
        }

        let choices = if is_unary {
            "Allow once? [y]es, allow [a]ll, or [n]o: "
        } else {
            "Allow? [y]es or [n]o: "
        };

        loop {
            eprint!("{choices}");
            if io::stderr().flush().is_err() {
                return PermissionPromptResponse::Deny;
            }

            let mut answer = String::new();
            match io::stdin().read_line(&mut answer) {
                Ok(0) | Err(_) => return PermissionPromptResponse::Deny,
                Ok(_) => match answer.trim().to_ascii_lowercase().as_str() {
                    "y" | "yes" => return PermissionPromptResponse::Allow,
                    "a" | "all" if is_unary => return PermissionPromptResponse::AllowAll,
                    "n" | "no" | "" => return PermissionPromptResponse::Deny,
                    _ => eprintln!("Please enter y, a, or n."),
                },
            }
        }
    }
}
