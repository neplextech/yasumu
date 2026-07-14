use std::path::Path;
use std::sync::Arc;

use deno_runtime::deno_core::{ModuleSpecifier, error::AnyError};

use crate::state::{NoopHost, RuntimeContext, RuntimeHost, RuntimeState};
use crate::version::TANXIUM_VERSION;
use crate::worker::start_worker;

/// Configures an embeddable Tanxium runtime.
pub struct TanxiumBuilder {
    context: RuntimeContext,
    host: Arc<dyn RuntimeHost>,
    main_worker_all_permissions: bool,
}

impl TanxiumBuilder {
    /// Sets the workspace used for package resolution.
    pub fn workspace_dir(mut self, path: impl Into<std::path::PathBuf>) -> Self {
        self.context.workspace_dir = Some(path.into());
        self
    }

    /// Sets the resource root exposed to JavaScript.
    pub fn resource_dir(mut self, path: impl Into<std::path::PathBuf>) -> Self {
        self.context.resource_dir = Some(path.into());
        self
    }

    /// Sets the initial frontend-ready state.
    pub fn ready(mut self, ready: bool) -> Self {
        self.context.ready = ready;
        self
    }

    /// Supplies host-specific event and confirmation behavior.
    pub fn host(mut self, host: Arc<dyn RuntimeHost>) -> Self {
        self.host = host;
        self
    }

    /// Controls whether the main worker receives every Deno permission at startup.
    ///
    /// This defaults to `true` for backwards compatibility with trusted host
    /// bootstrap code. Set it to `false` to start the main worker sandboxed;
    /// requests then use the installed permission prompter. Web workers always
    /// start without permissions, regardless of this setting.
    pub fn allow_main_worker_all_permissions(mut self, allow: bool) -> Self {
        self.main_worker_all_permissions = allow;
        self
    }

    /// Allows JavaScript modules to be imported over insecure HTTP.
    ///
    /// HTTPS imports remain enabled by default. Hosts should opt into HTTP only
    /// for trusted development or local-network use cases.
    pub fn allow_http_imports(mut self, allow: bool) -> Self {
        self.context.allow_http_imports = allow;
        self
    }

    /// Builds an embeddable runtime instance.
    pub fn build(self) -> Result<Tanxium, AnyError> {
        Ok(Tanxium {
            state: Arc::new(RuntimeState::new(self.context)),
            host: self.host,
            main_worker_all_permissions: self.main_worker_all_permissions,
        })
    }
}

/// An embeddable JavaScript and TypeScript runtime with Yasumu's runtime API.
#[derive(Clone)]
pub struct Tanxium {
    state: Arc<RuntimeState>,
    host: Arc<dyn RuntimeHost>,
    main_worker_all_permissions: bool,
}

impl Tanxium {
    /// Starts a runtime builder with safe headless defaults.
    pub fn builder() -> TanxiumBuilder {
        TanxiumBuilder {
            context: RuntimeContext {
                app_version: TANXIUM_VERSION.into(),
                ..Default::default()
            },
            host: Arc::new(NoopHost),
            main_worker_all_permissions: true,
        }
    }

    /// Starts a module on its own runtime thread and returns immediately.
    pub fn run_file(&self, file: impl AsRef<Path>) -> Result<(), AnyError> {
        let module = module_specifier_from_file(file)?;
        start_worker(
            module,
            self.state.clone(),
            self.host.clone(),
            self.main_worker_all_permissions,
        )
        .map(|_| ())
    }

    /// Runs a module and waits for its runtime thread to exit.
    pub fn run_file_blocking(&self, file: impl AsRef<Path>) -> Result<(), AnyError> {
        let module = module_specifier_from_file(file)?;
        start_worker(
            module,
            self.state.clone(),
            self.host.clone(),
            self.main_worker_all_permissions,
        )?
        .join()
        .map_err(|_| AnyError::msg("runtime thread panicked"))
    }

    /// Delivers a serialized host event to a running runtime.
    pub fn send_event(&self, event: impl Into<String>) {
        if let Some(sender) = self
            .state
            .event_sender
            .lock()
            .expect("event sender lock poisoned")
            .as_ref()
        {
            let _ = sender.send(event.into());
        }
    }

    /// Returns shared runtime state for advanced embedders.
    pub fn state(&self) -> Arc<RuntimeState> {
        self.state.clone()
    }
}

fn module_specifier_from_file(file: impl AsRef<Path>) -> Result<ModuleSpecifier, AnyError> {
    let file = std::fs::canonicalize(file)?;
    ModuleSpecifier::from_file_path(file).map_err(|_| AnyError::msg("invalid entrypoint path"))
}
