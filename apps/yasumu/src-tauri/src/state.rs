use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub type VirtualModulesStore = Arc<Mutex<HashMap<String, String>>>;

pub struct YasumuInternalState {
    pub ready: bool,
    pub rpc_port: Option<u16>,
    pub echo_server_port: Option<u16>,
    pub mcp_server_port: Option<u16>,
    pub virtual_modules: VirtualModulesStore,
    /// Root directory of the active workspace. `None` for the virtual workspace.
    pub workspace_dir: Option<PathBuf>,
}

impl YasumuInternalState {
    pub fn new() -> Self {
        Self {
            ready: false,
            rpc_port: None,
            echo_server_port: None,
            mcp_server_port: None,
            virtual_modules: Arc::new(Mutex::new(HashMap::new())),
            workspace_dir: None,
        }
    }
}
