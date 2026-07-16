//! An embeddable JavaScript/TypeScript runtime with Yasumu's runtime API.

mod module_loader;
mod node_services;
mod ops;
mod permissions;
mod runtime;
mod snapshot;
mod state;
mod types;
mod version;
mod worker;
mod yasumu_modules;

#[allow(dead_code)]
mod generated_runtime_contract;

pub use permissions::install_permission_prompter;
pub use runtime::{Tanxium, TanxiumBuilder};
pub use state::{
    PermissionPromptResponse, RuntimeContext, RuntimeEvent, RuntimeHost, RuntimeState,
};
