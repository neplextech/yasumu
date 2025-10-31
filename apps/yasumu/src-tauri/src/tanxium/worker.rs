use crate::tanxium::module_loader::TypescriptModuleLoader;
use crate::tanxium::ops::tanxium_rt;
use crate::tanxium::permissions::{cleanup_permission_channel, setup_permission_channel};
use crate::tanxium::state::init_renderer_event_channel;
use crate::tanxium::types::AppHandleState;
use deno_resolver::npm::DenoInNpmPackageChecker;
use deno_resolver::npm::NpmResolver;
use deno_runtime::BootstrapOptions;
use deno_runtime::deno_core::error::AnyError;
use deno_runtime::deno_core::ModuleSpecifier;
use deno_runtime::deno_fs::RealFs;
use deno_runtime::deno_permissions::Permissions;
use deno_runtime::deno_permissions::PermissionsContainer;
use deno_runtime::permissions::RuntimePermissionDescriptorParser;
use deno_runtime::worker::MainWorker;
use deno_runtime::worker::WorkerOptions;
use deno_runtime::worker::WorkerServiceOptions;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::Arc;
use std::thread;
use sys_traits::impls::RealSys;
use tauri::AppHandle;

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
            let thread_id = thread::current().id();
            
            let fs = Arc::new(RealFs);
            let permission_desc_parser: Arc<RuntimePermissionDescriptorParser<RealSys>> =
                Arc::new(RuntimePermissionDescriptorParser::new(RealSys));

            let source_map_store = Rc::new(RefCell::new(HashMap::new()));

            let permission_container =
                PermissionsContainer::new(permission_desc_parser, Permissions::none_with_prompt());

            setup_permission_channel(thread_id);

            let mut worker = MainWorker::bootstrap_from_options::<
                DenoInNpmPackageChecker,
                NpmResolver<RealSys>,
                RealSys,
            >(
                &main_module,
                WorkerServiceOptions {
                    module_loader: Rc::new(TypescriptModuleLoader {
                        source_maps: source_map_store,
                    }),
                    permissions: permission_container,
                    bundle_provider: Default::default(),
                    deno_rt_native_addon_loader: Default::default(),
                    blob_store: Default::default(),
                    broadcast_channel: Default::default(),
                    feature_checker: Default::default(),
                    node_services: Default::default(),
                    npm_process_state_provider: Default::default(),
                    root_cert_store_provider: Default::default(),
                    shared_array_buffer_store: Default::default(),
                    compiled_wasm_module_store: Default::default(),
                    v8_code_cache: Default::default(),
                    fetch_dns_resolver: Default::default(),
                    fs,
                },
                WorkerOptions {
                    extensions: vec![tanxium_rt::init()],
                    bootstrap: BootstrapOptions {
                        user_agent: format!("Yasumu/{}", env!("CARGO_PKG_VERSION")).to_string(),
                        close_on_idle: false,
                        ..Default::default()
                    },
                    enable_stack_trace_arg_in_ops: true,
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

            if let Err(e) = worker.execute_main_module(&main_module).await {
                cleanup_permission_channel(&thread_id);
                eprintln!("Failed to execute main module: {}", e);
                return;
            }

            let mut event_receiver = init_renderer_event_channel();
            
            loop {
                tokio::select! {
                    event_result = event_receiver.recv() => {
                        match event_result {
                            Some(event) => {
                                let script: String = format!(
                                    r#"if (globalThis.Yasumu) {{ Yasumu['~yasumu__on__Event__Callback']?.({}); }}"#,
                                    event
                                );
                                let _ = worker.js_runtime.execute_script("internal:event_callback", script);
                            }
                            None => {
                                println!("Event receiver channel closed");
                                break;
                            }
                        }
                    }
                    event_loop_result = worker.run_event_loop(false) => {
                        match event_loop_result {
                            Ok(_) => {
                            }
                            Err(e) => {
                                eprintln!("Worker event loop error: {}", e);
                                break;
                            }
                        }
                    }
                }
            }
            
            cleanup_permission_channel(&thread_id);
            
            println!("Deno runtime shutting down");
        });
    });

    Ok(())
}
