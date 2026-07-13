use tanxium_yasumu::YasumuRuntime;

pub struct YasumuInternalState {
    pub ready: bool,
    pub runtime: Option<YasumuRuntime>,
}

impl YasumuInternalState {
    pub fn new() -> Self {
        Self {
            ready: false,
            runtime: None,
        }
    }
}
