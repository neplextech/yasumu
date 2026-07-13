use crate::state::{RuntimeHost, RuntimeState};
use std::sync::Arc;

pub struct RuntimeHostState {
    pub host: Arc<dyn RuntimeHost>,
    pub state: Arc<RuntimeState>,
}
