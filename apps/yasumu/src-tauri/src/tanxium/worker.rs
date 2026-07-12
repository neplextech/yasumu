use crate::state::YasumuInternalState;
use crate::tanxium::module_loader::TypescriptModuleLoader;
use crate::tanxium::node_services;
use crate::tanxium::ops::tanxium_rt;
use crate::tanxium::permissions::setup_permission_channel;
use crate::tanxium::state::init_renderer_event_channel;
use crate::tanxium::types::AppHandleState;
use crate::tanxium::version::{DENO_VERSION, YASUMU_VERSION};
use deno_resolver::npm::{DenoInNpmPackageChecker, NpmResolver};
use deno_runtime::UNSTABLE_FEATURES;
use deno_runtime::colors;
use deno_runtime::deno_web::InMemoryBroadcastChannel;
use deno_runtime::deno_core::{
    CompiledWasmModuleStore, ModuleSpecifier, SharedArrayBufferStore, error::AnyError,
};
use deno_runtime::deno_fs::RealFs;
use deno_runtime::deno_io::Stdio;
use deno_runtime::deno_node::NodeResolver;
use deno_runtime::deno_permissions::{Permissions, PermissionsContainer};
use deno_runtime::deno_web::BlobStore;
use deno_runtime::ops::worker_host::CreateWebWorkerCb;
use deno_runtime::permissions::RuntimePermissionDescriptorParser;
use deno_runtime::web_worker::{WebWorker, WebWorkerOptions, WebWorkerServiceOptions};
use deno_runtime::worker::{MainWorker, WorkerOptions, WorkerServiceOptions};
use deno_runtime::{BootstrapOptions, FeatureChecker};
use node_resolver::PackageJsonResolver;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::{Arc, Mutex, RwLock};
use std::thread;
use std::time::Duration;
use sys_traits::impls::RealSys;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
use tracing::{error, info, warn};

const ENABLED_UNSTABLE: &[&str] = &["worker-options", "kv"];

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

fn enabled_unstable_feature_ids() -> Vec<i32> {
    UNSTABLE_FEATURES
        .iter()
        .filter(|f| ENABLED_UNSTABLE.contains(&f.name))
        .map(|f| f.id)
        .collect()
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
    fs: Arc<RealFs>,
    shared_array_buffer_store: SharedArrayBufferStore,
    app_handle: AppHandle,
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
            setup_permission_channel();

            let source_maps = Rc::new(RefCell::new(HashMap::new()));
            let module_loader = Rc::new(TypescriptModuleLoader {
                source_maps,
                virtual_modules: Some(shared.virtual_modules.clone()),
            });

            let permission_desc_parser =
                Arc::new(RuntimePermissionDescriptorParser::<RealSys>::new(RealSys));
            let permissions = PermissionsContainer::new(
                permission_desc_parser,
                Permissions::none_with_prompt(),
            );

            let create_web_worker_cb =
                shared.create_web_worker_callback(stdio.clone(), false);

            let node_require_loader = Rc::new(node_services::TanxiumNodeRequireLoader::new(
                shared.workspace_dir.as_deref(),
            ));
            let node_services = Some(node_services::create_node_init_services(
                node_require_loader,
                shared.node_resolver.clone(),
                shared.pkg_json_resolver.clone(),
            ));

            let user_agent = format!("Yasumu/{}", YASUMU_VERSION);

            let services = WebWorkerServiceOptions::<
                DenoInNpmPackageChecker,
                NpmResolver<RealSys>,
                RealSys,
            > {
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
                residual_lazy_js_sources: &[],
                residual_lazy_esm_sources: &[],
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
                    has_node_modules_dir: false,
                    argv0: None,
                    node_debug: None,
                    node_cluster_unique_id: None,
                    node_cluster_sched_policy: None,
                    node_ipc_init: None,
                    mode: deno_runtime::WorkerExecutionMode::Worker,
                    serve_port: None,
                    serve_host: None,
                    otel_config: Default::default(),
                    no_legacy_abort: false,
                    close_on_idle: args.close_on_idle,
                    disable_offscreen_canvas: false,
                },
                extensions: vec![tanxium_rt::init()],
                startup_snapshot: None,
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
                .put(AppHandleState {
                    app_handle: shared.app_handle.clone(),
                });

            (worker, handle)
        })
    }
}

async fn initialize_worker(
    main_module: &ModuleSpecifier,
    shared: &Arc<WorkerSharedState>,
    app_handle: &AppHandle,
) -> Result<MainWorker, AnyError> {
    let permission_desc_parser =
        Arc::new(RuntimePermissionDescriptorParser::<RealSys>::new(RealSys));
    let source_maps = Rc::new(RefCell::new(HashMap::new()));
    let user_agent = format!("Yasumu/{}", YASUMU_VERSION);

    let permissions =
        PermissionsContainer::new(permission_desc_parser, Permissions::allow_all());

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
            bootstrap: BootstrapOptions {
                deno_version: DENO_VERSION.to_string(),
                user_agent,
                unstable_features: enabled_unstable_feature_ids(),
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
        .put(AppHandleState {
            app_handle: app_handle.clone(),
        });

    info!("Executing main module: {}", main_module);
    worker.execute_main_module(main_module).await?;

    Ok(worker)
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
            }
        }
    }
}

pub fn create_and_start_worker(
    main_module: &ModuleSpecifier,
    app_handle: AppHandle,
) -> Result<(), AnyError> {
    let main_module = main_module.clone();

    thread::spawn(move || {
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

            let (virtual_modules, workspace_dir) = {
                let state = app_handle.state::<RwLock<YasumuInternalState>>();
                let guard = state.read().expect("state lock poisoned");
                (guard.virtual_modules.clone(), guard.workspace_dir.clone())
            };

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
                fs: Arc::new(RealFs),
                shared_array_buffer_store: SharedArrayBufferStore::default(),
                app_handle: app_handle.clone(),
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

                match initialize_worker(&main_module, &shared, &app_handle).await {
                    Ok(mut worker) => {
                        let mut event_receiver = init_renderer_event_channel();

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
                                    app_handle
                                        .dialog()
                                        .message(format!(
                                            "JavaScript runtime crashed:\n\n{}",
                                            msg
                                        ))
                                        .kind(MessageDialogKind::Error)
                                        .title("JavaScript runtime crashed unexpectedly")
                                        .blocking_show();
                                    app_handle.exit(1);
                                    break;
                                }
                            }
                        }
                    }
                    Err(e) => {
                        error!("Failed to initialize worker: {}", e);
                        retry_count += 1;
                        if retry_count > MAX_RETRIES {
                            error!("Exceeded max retries — giving up");
                            break;
                        }
                    }
                }
            }

            info!("Deno runtime thread exiting");
        });
    });

    Ok(())
}
