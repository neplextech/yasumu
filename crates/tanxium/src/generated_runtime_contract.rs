//! This file is generated from packages/runtime-api/contract/runtime-api.json. Do not edit.

pub const YASUMU_RUNTIME_API_VERSION: u32 = 1;
pub const YASUMU_SCRIPT_HOOKS: &[&str] = &["onRequest", "onResponse", "onTest", "onEmail"];
pub const YASUMU_VIRTUAL_MODULES: &[&str] = &[
    "yasumu:test",
    "yasumu:workspace",
    "yasumu:runtime",
    "yasumu:env",
    "yasumu:files",
];
pub const YASUMU_RUNTIME_CAPABILITIES: &[&str] = &[
    "workers",
    "nodeBuiltins",
    "filesystemRead",
    "filesystemWrite",
    "network",
    "environment",
    "subprocess",
    "ffi",
    "nativeModules",
    "virtualModules",
    "workspaceFiles",
    "email",
    "nestedExecution",
];
pub const YASUMU_RUNTIME_HOST_METHODS: &[&str] = &[
    "entity.get",
    "entity.list",
    "entity.execute",
    "email.list",
    "email.next",
    "file.resolve",
    "file.open",
    "permission.request",
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum YasumuScriptHook {
    OnRequest,
    OnResponse,
    OnTest,
    OnEmail,
}

impl YasumuScriptHook {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::OnRequest => "onRequest",
            Self::OnResponse => "onResponse",
            Self::OnTest => "onTest",
            Self::OnEmail => "onEmail",
        }
    }
}
