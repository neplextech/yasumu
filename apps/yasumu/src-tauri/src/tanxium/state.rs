use std::sync::{LazyLock, Mutex};
use tokio::sync::mpsc;

pub static RENDERER_EVENT_SENDER: LazyLock<Mutex<Option<mpsc::UnboundedSender<String>>>> =
    LazyLock::new(|| Mutex::new(None));

pub fn init_renderer_event_channel() -> mpsc::UnboundedReceiver<String> {
    let (tx, rx) = mpsc::unbounded_channel();
    *RENDERER_EVENT_SENDER
        .lock()
        .expect("renderer event sender lock poisoned") = Some(tx);
    rx
}

pub fn get_renderer_event_sender() -> Option<mpsc::UnboundedSender<String>> {
    RENDERER_EVENT_SENDER
        .lock()
        .expect("renderer event sender lock poisoned")
        .clone()
}
