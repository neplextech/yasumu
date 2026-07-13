use crate::module_loader::TypescriptModuleLoader;
use crate::node_services;
use crate::ops::tanxium_rt;
use crate::state::{NoopHost, RuntimeContext, RuntimeEvent, RuntimeHost, RuntimeState};
use crate::types::RuntimeHostState;
use crate::version::{DENO_VERSION, TANXIUM_VERSION};
use deno_resolver::npm::{DenoInNpmPackageChecker, NpmResolver};
use deno_runtime::UNSTABLE_FEATURES;
use deno_runtime::colors;
use deno_runtime::deno_core::{
    CompiledWasmModuleStore, ModuleSpecifier, SharedArrayBufferStore, error::AnyError,
};
use deno_runtime::deno_fs::{FileSystem, RealFs};
use deno_runtime::deno_io::Stdio;
use deno_runtime::deno_node::NodeResolver;
use deno_runtime::deno_permissions::{Permissions, PermissionsContainer};
use deno_runtime::deno_web::BlobStore;
use deno_runtime::deno_web::InMemoryBroadcastChannel;
use deno_runtime::ops::worker_host::CreateWebWorkerCb;
use deno_runtime::permissions::RuntimePermissionDescriptorParser;
use deno_runtime::web_worker::{WebWorker, WebWorkerOptions, WebWorkerServiceOptions};
use deno_runtime::worker::{MainWorker, WorkerOptions, WorkerServiceOptions};
use deno_runtime::{BootstrapOptions, FeatureChecker};
use node_resolver::PackageJsonResolver;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use sys_traits::impls::RealSys;
use tracing::{error, info, warn};

const ENABLED_UNSTABLE: &[&str] = &["worker-options", "kv", "cron", "detect-cjs"];

#[inline]
fn build_feature_checker() -> Arc<FeatureChecker> {
    let mut checker = FeatureChecker::default();
    for f in UNSTABLE_FEATURES
        .iter()
        .filter(|f| ENABLED_UNSTABLE.contains(&f.name))
    {
        checker.enable_feature(f.name);
    }
    Arc::new(checker)
}

#[inline]
fn enabled_unstable_feature_ids() -> Vec<i32> {
    UNSTABLE_FEATURES
        .iter()
        .filter(|f| ENABLED_UNSTABLE.contains(&f.name))
        .map(|f| f.id)
        .collect()
}

#[inline]
fn create_file_system() -> Arc<dyn FileSystem> {
    Arc::new(RealFs)
}

/// Exponential backoff with lightweight jitter derived from the current clock.
fn compute_backoff(attempt: u32) -> Duration {
    let base_ms: u64 = 500;
    let cap_ms: u64 = 30_000;
    let exp_ms = base_ms.saturating_mul(1u64 << attempt.min(6));
    let capped = exp_ms.min(cap_ms);
    // Derive jitter (0–25% of delay) from subsecond clock nanos.
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .subsec_nanos() as u64;
    let jitter = nanos % (capped / 4 + 1);
    Duration::from_millis(capped + jitter)
}

struct WorkerSharedState {
    blob_store: Arc<BlobStore>,
    broadcast_channel: InMemoryBroadcastChannel,
    compiled_wasm_module_store: CompiledWasmModuleStore,
    fs: Arc<dyn FileSystem>,
    shared_array_buffer_store: SharedArrayBufferStore,
    host: Arc<dyn RuntimeHost>,
    state: Arc<RuntimeState>,
    node_resolver: Arc<NodeResolver<DenoInNpmPackageChecker, NpmResolver<RealSys>, RealSys>>,
    pkg_json_resolver: Arc<PackageJsonResolver<RealSys>>,
    virtual_modules: Arc<Mutex<HashMap<String, String>>>,
    workspace_dir: Option<std::path::PathBuf>,
}

impl WorkerSharedState {
    fn create_web_worker_callback(
        self: &Arc<Self>,
        stdio: Stdio,
        _is_parent_main_worker: bool,
    ) -> Arc<CreateWebWorkerCb> {
        let shared = self.clone();
        Arc::new(move |args| {
            let source_maps = Rc::new(RefCell::new(HashMap::new()));
            let module_loader = Rc::new(TypescriptModuleLoader {
                source_maps,
                virtual_modules: Some(shared.virtual_modules.clone()),
                blob_store: Some(shared.blob_store.clone()),
                main_module_blob: args
                    .maybe_main_module_blob
                    .clone()
                    .map(|blob| (args.main_module.clone(), blob)),
                state: shared.state.clone(),
                pkg_json_resolver: shared.pkg_json_resolver.clone(),
            });

            let permission_desc_parser =
                Arc::new(RuntimePermissionDescriptorParser::<RealSys>::new(RealSys));
            let permissions =
                PermissionsContainer::new(permission_desc_parser, Permissions::none_with_prompt());

            let create_web_worker_cb = shared.create_web_worker_callback(stdio.clone(), false);

            let node_require_loader = Rc::new(node_services::TanxiumNodeRequireLoader::new(
                shared.workspace_dir.as_deref(),
            ));
            let node_services = Some(node_services::create_node_init_services(
                node_require_loader,
                shared.node_resolver.clone(),
                shared.pkg_json_resolver.clone(),
            ));

            let user_agent = format!("Yasumu/{}", TANXIUM_VERSION);

            let services =
                WebWorkerServiceOptions::<DenoInNpmPackageChecker, NpmResolver<RealSys>, RealSys> {
                    deno_rt_native_addon_loader: Default::default(),
                    root_cert_store_provider: Default::default(),
                    module_loader,
                    fs: shared.fs.clone(),
                    node_services,
                    blob_store: shared.blob_store.clone(),
                    broadcast_channel: shared.broadcast_channel.clone(),
                    shared_array_buffer_store: Some(shared.shared_array_buffer_store.clone()),
                    compiled_wasm_module_store: Some(shared.compiled_wasm_module_store.clone()),
                    main_inspector_session_tx: Default::default(),
                    feature_checker: build_feature_checker(),
                    npm_process_state_provider: Default::default(),
                    permissions,
                    bundle_provider: None,
                };

            let options = WebWorkerOptions {
                name: args.name,
                main_module: args.main_module.clone(),
                worker_id: args.worker_id,
                residual_lazy_js_sources: deno_snapshots::RESIDUAL_LAZY_JS,
                residual_lazy_esm_sources: deno_snapshots::RESIDUAL_LAZY_ESM,
                maybe_main_module_blob: None,
                maybe_cpu_prof_config: None,
                wait_for_debugger_on_start: false,
                wait_for_page_wait_for_debugger: false,
                bootstrap: BootstrapOptions {
                    deno_version: DENO_VERSION.to_string(),
                    args: vec![],
                    cpu_count: thread::available_parallelism()
                        .map(|p| p.get())
                        .unwrap_or(1),
                    log_level: deno_runtime::WorkerLogLevel::Info,
                    enable_testing_features: false,
                    locale: deno_core::v8::icu::get_language_tag(),
                    location: Some(args.main_module.clone()),
                    color_level: colors::get_color_level(),
                    unstable_features: enabled_unstable_feature_ids(),
                    user_agent,
                    inspect: false,
                    is_standalone: false,
                    auto_serve: false,
                    has_node_modules_dir: true,
                    mode: deno_runtime::WorkerExecutionMode::Worker,
                    no_legacy_abort: false,
                    close_on_idle: args.close_on_idle,
                    disable_offscreen_canvas: true,
                    ..Default::default()
                },
                extensions: vec![tanxium_rt::init()],
                startup_snapshot: deno_snapshots::CLI_SNAPSHOT,
                create_params: None,
                unsafely_ignore_certificate_errors: None,
                seed: None,
                create_web_worker_cb,
                format_js_error_fn: None,
                worker_type: args.worker_type,
                stdio: stdio.clone(),
                cache_storage_dir: None,
                trace_ops: None,
                close_on_idle: args.close_on_idle,
                maybe_worker_metadata: args.maybe_worker_metadata,
                maybe_coverage_dir: None,
                enable_raw_imports: true,
                enable_stack_trace_arg_in_ops: true,
            };

            let (worker, handle) = WebWorker::bootstrap_from_options(services, options);

            worker
                .js_runtime
                .op_state()
                .borrow_mut()
                .put(RuntimeHostState {
                    host: shared.host.clone(),
                    state: shared.state.clone(),
                });

            (worker, handle)
        })
    }
}

async fn initialize_worker(
    main_module: &ModuleSpecifier,
    shared: &Arc<WorkerSharedState>,
    host: Arc<dyn RuntimeHost>,
    main_worker_all_permissions: bool,
) -> Result<MainWorker, AnyError> {
    let permission_desc_parser =
        Arc::new(RuntimePermissionDescriptorParser::<RealSys>::new(RealSys));
    let source_maps = Rc::new(RefCell::new(HashMap::new()));
    let user_agent = format!("Yasumu/{}", TANXIUM_VERSION);

    let initial_permissions = if main_worker_all_permissions {
        Permissions::allow_all()
    } else {
        Permissions::none_with_prompt()
    };
    let permissions = PermissionsContainer::new(permission_desc_parser, initial_permissions);

    let stdio = Stdio::default();
    let create_web_worker_cb = shared.create_web_worker_callback(stdio.clone(), true);

    let node_require_loader = Rc::new(node_services::TanxiumNodeRequireLoader::new(
        shared.workspace_dir.as_deref(),
    ));
    let node_services = Some(node_services::create_node_init_services(
        node_require_loader,
        shared.node_resolver.clone(),
        shared.pkg_json_resolver.clone(),
    ));

    let mut worker = MainWorker::bootstrap_from_options::<
        DenoInNpmPackageChecker,
        NpmResolver<RealSys>,
        RealSys,
    >(
        main_module,
        WorkerServiceOptions {
            module_loader: Rc::new(TypescriptModuleLoader {
                source_maps,
                virtual_modules: Some(shared.virtual_modules.clone()),
                blob_store: Some(shared.blob_store.clone()),
                main_module_blob: None,
                state: shared.state.clone(),
                pkg_json_resolver: shared.pkg_json_resolver.clone(),
            }),
            permissions,
            bundle_provider: Default::default(),
            deno_rt_native_addon_loader: Default::default(),
            blob_store: shared.blob_store.clone(),
            broadcast_channel: shared.broadcast_channel.clone(),
            feature_checker: build_feature_checker(),
            node_services,
            npm_process_state_provider: Default::default(),
            root_cert_store_provider: Default::default(),
            shared_array_buffer_store: Some(shared.shared_array_buffer_store.clone()),
            compiled_wasm_module_store: Some(shared.compiled_wasm_module_store.clone()),
            v8_code_cache: Default::default(),
            fetch_dns_resolver: Default::default(),
            fs: shared.fs.clone(),
        },
        WorkerOptions {
            extensions: vec![tanxium_rt::init()],
            startup_snapshot: deno_snapshots::CLI_SNAPSHOT,
            residual_lazy_js_sources: deno_snapshots::RESIDUAL_LAZY_JS,
            residual_lazy_esm_sources: deno_snapshots::RESIDUAL_LAZY_ESM,
            bootstrap: BootstrapOptions {
                deno_version: DENO_VERSION.to_string(),
                user_agent,
                unstable_features: enabled_unstable_feature_ids(),
                // Enable Deno's Node compatibility bootstrap for main workers.
                // Without this, CommonJS modules that use `createRequire()`
                // cannot initialize their Node built-ins.
                has_node_modules_dir: true,
                close_on_idle: false,
                ..Default::default()
            },
            stdio: stdio.clone(),
            enable_stack_trace_arg_in_ops: true,
            create_web_worker_cb,
            ..Default::default()
        },
    );

    worker
        .js_runtime
        .op_state()
        .borrow_mut()
        .put(RuntimeHostState {
            host,
            state: shared.state.clone(),
        });

    initialize_node_runtime(&mut worker).await?;

    info!("Executing main module: {}", main_module);
    worker.execute_main_module(main_module).await?;

    Ok(worker)
}

/// Completes Deno's lazy Node bootstrap before CommonJS code is evaluated.
///
/// This must run after `MainWorker::bootstrap_from_options`: the Node
/// polyfills depend on the fully initialized Deno namespace (`Deno.env`,
/// `Deno.build`, and related runtime state).
async fn initialize_node_runtime(worker: &mut MainWorker) -> Result<(), AnyError> {
    let module = ModuleSpecifier::parse("ext:tanxium_rt/node-bootstrap")?;
    let module_id = worker
        .js_runtime
        .load_side_es_module_from_code(
            &module,
            r#"
                import { core } from "ext:core/mod.js";

                core.createLazyLoader("node:process")();
                core.createLazyLoader("node:module")();
                globalThis.nodeBootstrap({
                  usesLocalNodeModulesDir: true,
                  runningOnMainThread: true,
                  argv0: undefined,
                  nodeDebug: undefined,
                  nodeClusterUniqueId: undefined,
                  nodeClusterSchedPolicy: undefined,
                  denoArgs: Deno.args,
                  denoVersion: Deno.version,
                });
            "#,
        )
        .await?;

    worker.evaluate_module(module_id).await?;
    Ok(())
}

async fn run_worker_event_loop(
    worker: &mut MainWorker,
    event_receiver: &mut tokio::sync::mpsc::UnboundedReceiver<String>,
) -> Result<(), AnyError> {
    loop {
        tokio::select! {
            maybe_event = event_receiver.recv() => {
                match maybe_event {
                    Some(event) => {
                        let script = format!(
                            r#"if (globalThis.Yasumu) {{ Yasumu['~yasumu__on__Event__Callback']?.({}); }}"#,
                            event
                        );
                        if let Err(e) = worker.js_runtime.execute_script("internal:event_callback", script) {
                            error!("Error executing event callback: {}", e);
                        }
                    }
                    None => {
                        info!("Renderer event channel closed — shutting down worker");
                        return Err(AnyError::msg("Event receiver channel closed"));
                    }
                }
            }
            result = worker.run_event_loop(false) => {
                if let Err(e) = result {
                    error!("Worker event loop error: {}", e);
                    return Err(e.into());
                }
                return Ok(());
            }
        }
    }
}

fn start_worker(
    main_module: ModuleSpecifier,
    state: Arc<RuntimeState>,
    host: Arc<dyn RuntimeHost>,
    main_worker_all_permissions: bool,
) -> Result<std::thread::JoinHandle<()>, AnyError> {
    let handle = thread::spawn(move || {
        info!("Starting Deno runtime thread");

        let runtime = match tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
        {
            Ok(rt) => rt,
            Err(e) => {
                error!("Failed to create tokio runtime: {}", e);
                return;
            }
        };

        runtime.block_on(async move {
            let pkg_json_resolver = node_services::create_pkg_json_resolver();

            let workspace_dir = state
                .context
                .read()
                .expect("runtime context lock poisoned")
                .workspace_dir
                .clone();
            let virtual_modules = state.virtual_modules.clone();

            let fs = create_file_system();

            let npm_resolver = node_services::create_npm_resolver(
                pkg_json_resolver.clone(),
                workspace_dir.as_deref(),
            );
            let node_resolver =
                node_services::create_node_resolver(npm_resolver, pkg_json_resolver.clone());

            let shared = Arc::new(WorkerSharedState {
                blob_store: Arc::new(BlobStore::default()),
                broadcast_channel: InMemoryBroadcastChannel::default(),
                compiled_wasm_module_store: CompiledWasmModuleStore::default(),
                fs,
                shared_array_buffer_store: SharedArrayBufferStore::default(),
                host: host.clone(),
                state: state.clone(),
                node_resolver,
                pkg_json_resolver,
                virtual_modules,
                workspace_dir,
            });

            const MAX_RETRIES: u32 = 5;
            let mut retry_count = 0u32;

            loop {
                if retry_count > 0 {
                    let delay = compute_backoff(retry_count - 1);
                    warn!(
                        "Reinitializing worker (attempt {}/{}) after {:?}",
                        retry_count + 1,
                        MAX_RETRIES + 1,
                        delay
                    );
                    tokio::time::sleep(delay).await;
                }

                match initialize_worker(
                    &main_module,
                    &shared,
                    host.clone(),
                    main_worker_all_permissions,
                )
                .await
                {
                    Ok(mut worker) => {
                        let (event_sender, mut event_receiver) =
                            tokio::sync::mpsc::unbounded_channel();
                        *state
                            .event_sender
                            .lock()
                            .expect("event sender lock poisoned") = Some(event_sender);

                        match run_worker_event_loop(&mut worker, &mut event_receiver).await {
                            Ok(_) => {
                                info!("Worker event loop completed normally");
                                break;
                            }
                            Err(e) => {
                                let msg = e.to_string();

                                if msg.contains("Event receiver channel closed") {
                                    info!("Renderer channel closed — shutting down");
                                    break;
                                }

                                error!("Worker error: {}", msg);
                                retry_count += 1;

                                if retry_count > MAX_RETRIES {
                                    error!(
                                        "Exceeded max retries ({}) — showing crash dialog",
                                        MAX_RETRIES
                                    );
                                    host.emit_event(RuntimeEvent::Failure(msg));
                                    break;
                                }
                            }
                        }
                    }
                    Err(e) => {
                        let message = format!("Failed to initialize worker: {e}");
                        error!("{message}");
                        retry_count += 1;
                        if retry_count > MAX_RETRIES {
                            error!("Exceeded max retries — giving up");
                            host.emit_event(RuntimeEvent::Failure(message));
                            break;
                        }
                    }
                }
            }

            info!("Deno runtime thread exiting");
        });
    });

    Ok(handle)
}

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
    /// Builds an embeddable runtime instance.
    pub fn build(self) -> Result<Tanxium, AnyError> {
        Ok(Tanxium {
            state: Arc::new(RuntimeState::new(self.context)),
            host: self.host,
            main_worker_all_permissions: self.main_worker_all_permissions,
        })
    }
}
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
    pub fn run_file(&self, file: impl AsRef<std::path::Path>) -> Result<(), AnyError> {
        let file = std::fs::canonicalize(file)?;
        let module = ModuleSpecifier::from_file_path(file)
            .map_err(|_| AnyError::msg("invalid entrypoint path"))?;
        start_worker(
            module,
            self.state.clone(),
            self.host.clone(),
            self.main_worker_all_permissions,
        )
        .map(|_| ())
    }
    /// Runs a module and waits for its runtime thread to exit.
    pub fn run_file_blocking(&self, file: impl AsRef<std::path::Path>) -> Result<(), AnyError> {
        let file = std::fs::canonicalize(file)?;
        let module = ModuleSpecifier::from_file_path(file)
            .map_err(|_| AnyError::msg("invalid entrypoint path"))?;
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
