use crate::YasumuInternalState;
use crate::tanxium::module_loader::TypescriptModuleLoader;
use crate::tanxium::node_services;
use crate::tanxium::ops::tanxium_rt;
use crate::tanxium::permissions::setup_permission_channel;
use crate::tanxium::state::init_renderer_event_channel;
use crate::tanxium::types::AppHandleState;
use crate::tanxium::version::DENO_VERSION;
use deno_resolver::npm::DenoInNpmPackageChecker;
use deno_resolver::npm::NpmResolver;
use deno_runtime::UNSTABLE_FEATURES;
use deno_runtime::colors;
use deno_runtime::deno_broadcast_channel::InMemoryBroadcastChannel;
use deno_runtime::deno_core::CompiledWasmModuleStore;
use deno_runtime::deno_core::ModuleSpecifier;
use deno_runtime::deno_core::SharedArrayBufferStore;
use deno_runtime::deno_core::error::AnyError;
use deno_runtime::deno_fs::RealFs;
use deno_runtime::deno_io::Stdio;
use deno_runtime::deno_node::NodeResolver;
use deno_runtime::deno_permissions::Permissions;
use deno_runtime::deno_permissions::PermissionsContainer;
use deno_runtime::deno_web::BlobStore;
use deno_runtime::ops::worker_host::CreateWebWorkerCb;
use deno_runtime::permissions::RuntimePermissionDescriptorParser;
use deno_runtime::web_worker::{WebWorker, WebWorkerOptions, WebWorkerServiceOptions};
use deno_runtime::worker::MainWorker;
use deno_runtime::worker::WorkerOptions;
use deno_runtime::worker::WorkerServiceOptions;
use deno_runtime::{BootstrapOptions, FeatureChecker};
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::{Arc, Mutex};
use std::thread;
use sys_traits::impls::RealSys;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_dialog::MessageDialogKind;

use crate::tanxium::version::YASUMU_VERSION;

struct WorkerSharedState {
    blob_store: Arc<BlobStore>,
    broadcast_channel: InMemoryBroadcastChannel,
    compiled_wasm_module_store: CompiledWasmModuleStore,
    fs: Arc<RealFs>,
    shared_array_buffer_store: SharedArrayBufferStore,
    app_handle: AppHandle,
    node_resolver: Arc<NodeResolver<DenoInNpmPackageChecker, NpmResolver<RealSys>, RealSys>>,
    pkg_json_resolver: Arc<node_resolver::PackageJsonResolver<RealSys>>,
    virtual_modules: Arc<Mutex<HashMap<String, String>>>,
}

impl WorkerSharedState {
    fn create_web_worker_callback(
        self: &Arc<Self>,
        stdio: Stdio,
        _is_parent_main_worker: bool,
    ) -> Arc<CreateWebWorkerCb> {
        let shared = self.clone();
        Arc::new(move |args| {
            let worker_thread_id = thread::current().id();

            setup_permission_channel(worker_thread_id);

            let worker_source_maps = Rc::new(RefCell::new(HashMap::new()));
            let worker_module_loader = Rc::new(TypescriptModuleLoader {
                source_maps: worker_source_maps,
                virtual_modules: Some(shared.virtual_modules.clone()),
            });

            let permission_desc_parser: Arc<RuntimePermissionDescriptorParser<RealSys>> =
                Arc::new(RuntimePermissionDescriptorParser::new(RealSys));

            // let permissions_container = if is_parent_main_worker {
            //     args.parent_permissions.clone()
            // } else {
            //     PermissionsContainer::new(
            //         permission_desc_parser.clone(),
            //         Permissions::none_with_prompt(),
            //     )
            // };
            let permissions_container = PermissionsContainer::new(
                permission_desc_parser.clone(),
                Permissions::none_with_prompt(),
            );

            let create_web_worker_cb = shared.create_web_worker_callback(stdio.clone(), false);

            let node_require_loader = Rc::new(node_services::TanxiumNodeRequireLoader::new());
            let node_services = Some(node_services::create_node_init_services(
                node_require_loader,
                shared.node_resolver.clone(),
                shared.pkg_json_resolver.clone(),
            ));

            let mut feature_checker = FeatureChecker::default();
            feature_checker.enable_feature(
                UNSTABLE_FEATURES
                    .iter()
                    .find(|f| f.name == "worker-options" || f.name == "kv")
                    .unwrap()
                    .name,
            );

            let services =
                WebWorkerServiceOptions::<DenoInNpmPackageChecker, NpmResolver<RealSys>, RealSys> {
                    deno_rt_native_addon_loader: Default::default(),
                    root_cert_store_provider: Default::default(),
                    module_loader: worker_module_loader,
                    fs: shared.fs.clone(),
                    node_services,
                    blob_store: shared.blob_store.clone(),
                    broadcast_channel: shared.broadcast_channel.clone(),
                    shared_array_buffer_store: Some(shared.shared_array_buffer_store.clone()),
                    compiled_wasm_module_store: Some(shared.compiled_wasm_module_store.clone()),
                    maybe_inspector_server: None,
                    feature_checker: Arc::new(feature_checker),
                    npm_process_state_provider: Default::default(),
                    permissions: permissions_container,
                };

            let user_agent = format!("Yasumu/{}", YASUMU_VERSION);

            let options = WebWorkerOptions {
                name: args.name,
                main_module: args.main_module.clone(),
                worker_id: args.worker_id,
                bootstrap: BootstrapOptions {
                    deno_version: DENO_VERSION.to_string(),
                    args: vec![],
                    cpu_count: std::thread::available_parallelism()
                        .map(|p| p.get())
                        .unwrap_or(1),
                    log_level: deno_runtime::WorkerLogLevel::Info,
                    enable_op_summary_metrics: false,
                    enable_testing_features: false,
                    locale: deno_core::v8::icu::get_language_tag(),
                    location: Some(args.main_module.clone()),
                    color_level: colors::get_color_level(),
                    unstable_features: UNSTABLE_FEATURES
                        .iter()
                        .filter(|f| f.name == "worker-options" || f.name == "kv")
                        .map(|f| f.id)
                        .collect(),
                    user_agent: user_agent.clone(),
                    inspect: false,
                    is_standalone: false,
                    auto_serve: false,
                    has_node_modules_dir: false,
                    argv0: None,
                    node_debug: None,
                    node_ipc_fd: None,
                    mode: deno_runtime::WorkerExecutionMode::Worker,
                    serve_port: None,
                    serve_host: None,
                    otel_config: Default::default(),
                    no_legacy_abort: false,
                    close_on_idle: args.close_on_idle,
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
    shared_state: &Arc<WorkerSharedState>,
    app_handle: &AppHandle,
) -> Result<MainWorker, AnyError> {
    let fs = Arc::new(RealFs);
    let permission_desc_parser: Arc<RuntimePermissionDescriptorParser<RealSys>> =
        Arc::new(RuntimePermissionDescriptorParser::new(RealSys));

    let source_map_store = Rc::new(RefCell::new(HashMap::new()));

    let user_agent = format!("Yasumu/{}", YASUMU_VERSION);

    // main worker is allowed to do anything
    // as it is supposed to run our own/trusted code
    let permission_container =
        PermissionsContainer::new(permission_desc_parser.clone(), Permissions::allow_all());

    let stdio = Stdio::default();

    let create_web_worker_cb = shared_state.create_web_worker_callback(stdio.clone(), true);

    let mut feature_checker = FeatureChecker::default();

    feature_checker.enable_feature(
        UNSTABLE_FEATURES
            .iter()
            .find(|f| f.name == "worker-options" || f.name == "kv")
            .unwrap()
            .name,
    );

    let node_require_loader = Rc::new(node_services::TanxiumNodeRequireLoader::new());
    let node_services = Some(node_services::create_node_init_services(
        node_require_loader,
        shared_state.node_resolver.clone(),
        shared_state.pkg_json_resolver.clone(),
    ));

    let mut worker = MainWorker::bootstrap_from_options::<
        DenoInNpmPackageChecker,
        NpmResolver<RealSys>,
        RealSys,
    >(
        main_module,
        WorkerServiceOptions {
            module_loader: Rc::new(TypescriptModuleLoader {
                source_maps: source_map_store,
                virtual_modules: Some(shared_state.virtual_modules.clone()),
            }),
            permissions: permission_container,
            bundle_provider: Default::default(),
            deno_rt_native_addon_loader: Default::default(),
            blob_store: shared_state.blob_store.clone(),
            broadcast_channel: shared_state.broadcast_channel.clone(),
            feature_checker: Arc::new(feature_checker),
            node_services,
            npm_process_state_provider: Default::default(),
            root_cert_store_provider: Default::default(),
            shared_array_buffer_store: Some(shared_state.shared_array_buffer_store.clone()),
            compiled_wasm_module_store: Some(shared_state.compiled_wasm_module_store.clone()),
            v8_code_cache: Default::default(),
            fetch_dns_resolver: Default::default(),
            fs,
        },
        WorkerOptions {
            extensions: vec![tanxium_rt::init()],
            bootstrap: BootstrapOptions {
                deno_version: DENO_VERSION.to_string(),
                user_agent: user_agent.clone(),
                close_on_idle: false,
                unstable_features: UNSTABLE_FEATURES
                    .iter()
                    .filter(|f| f.name == "worker-options" || f.name == "kv")
                    .map(|f| f.id)
                    .collect(),
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

    println!("Executing main module: {}", main_module);

    worker.execute_main_module(main_module).await?;

    Ok(worker)
}

async fn run_worker_event_loop(
    worker: &mut MainWorker,
    event_receiver: &mut tokio::sync::mpsc::UnboundedReceiver<String>,
) -> Result<(), AnyError> {
    loop {
        tokio::select! {
            event_result = event_receiver.recv() => {
                match event_result {
                    Some(event) => {
                        let script: String = format!(
                            r#"if (globalThis.Yasumu) {{ Yasumu['~yasumu__on__Event__Callback']?.({}); }}"#,
                            event
                        );
                        if let Err(e) = worker.js_runtime.execute_script("internal:event_callback", script) {
                            eprintln!("Error executing event callback script: {}", e);
                        }
                    }
                    None => {
                        println!("Event receiver channel closed");
                        return Err(AnyError::msg("Event receiver channel closed"));
                    }
                }
            }
            event_loop_result = worker.run_event_loop(false) => {
                match event_loop_result {
                    Ok(_) => {
                    }
                    Err(e) => {
                        let error_msg = format!("Worker event loop error: {}", e);
                        eprintln!("{}", error_msg);

                        let error_str = e.to_string();
                        if error_str.contains("Unhandled error in child worker") {
                            eprintln!("Child worker error detected - will recover");
                            return Err(AnyError::from(e));
                        }

                        return Err(AnyError::from(e));
                    }
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

    std::thread::spawn(move || {
        println!("Starting Deno runtime thread");

        let runtime = match tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
        {
            Ok(runtime) => runtime,
            Err(e) => {
                eprintln!("Failed to create tokio runtime: {}", e);
                return;
            }
        };

        println!("Tokio runtime created, blocking on async block");

        runtime.block_on(async move {
            let pkg_json_resolver = node_services::create_pkg_json_resolver();
            let npm_resolver = node_services::create_npm_resolver(pkg_json_resolver.clone());
            let node_resolver =
                node_services::create_node_resolver(npm_resolver, pkg_json_resolver.clone());

            let virtual_modules = {
                let yasumu_state = app_handle.state::<Mutex<YasumuInternalState>>();
                let guard = yasumu_state.lock().unwrap();
                guard.virtual_modules.clone()
            };

            let shared_state = Arc::new(WorkerSharedState {
                blob_store: Arc::new(BlobStore::default()),
                broadcast_channel: InMemoryBroadcastChannel::default(),
                compiled_wasm_module_store: CompiledWasmModuleStore::default(),
                fs: Arc::new(RealFs),
                shared_array_buffer_store: SharedArrayBufferStore::default(),
                app_handle: app_handle.clone(),
                node_resolver,
                pkg_json_resolver,
                virtual_modules,
            });

            let mut retry_count = 0;
            const MAX_RETRIES: u32 = 5;
            const RETRY_DELAY_MS: u64 = 1000;

            loop {
                if retry_count > 0 {
                    println!("Reinitializing worker (attempt {})...", retry_count + 1);
                    tokio::time::sleep(tokio::time::Duration::from_millis(RETRY_DELAY_MS)).await;
                }

                match initialize_worker(&main_module, &shared_state, &app_handle).await {
                    Ok(mut worker) => {
                        let mut event_receiver = init_renderer_event_channel();

                        match run_worker_event_loop(&mut worker, &mut event_receiver).await {
                            Ok(_) => {
                                println!("Worker event loop completed normally");
                                break;
                            }
                            Err(e) => {
                                let error_str = e.to_string();

                                if error_str.contains("Event receiver channel closed") {
                                    println!("Event receiver closed - shutting down gracefully");
                                    break;
                                }

                                eprintln!("Worker event loop error: {}", e);
                                retry_count += 1;

                                if retry_count > MAX_RETRIES {
                                    eprintln!(
                                        "Max retries ({}) exceeded - shutting down",
                                        MAX_RETRIES
                                    );
                                    let message = format!(
                                        "Error that crashed the JavaScript runtime:\n\n{}",
                                        error_str
                                    );
                                    app_handle
                                        .dialog()
                                        .message(message)
                                        .kind(MessageDialogKind::Error)
                                        .title("JavaScript runtime crashed unexpectedly")
                                        .blocking_show();
                                    app_handle.exit(1);
                                    break;
                                }

                                println!("Attempting to recover worker...");
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to initialize worker: {}", e);
                        retry_count += 1;

                        if retry_count > MAX_RETRIES {
                            eprintln!("Max retries ({}) exceeded - shutting down", MAX_RETRIES);
                            break;
                        }
                    }
                }
            }

            println!("Deno runtime shutting down");
        });
    });

    Ok(())
}
