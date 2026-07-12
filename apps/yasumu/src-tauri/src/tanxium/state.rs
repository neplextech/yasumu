use crate::tanxium::types::PermissionsResponse;
use crossbeam_channel::{Receiver, Sender};
use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};
use tokio::sync::mpsc;

/// Holds the two ends of a permission prompt channel for a single worker thread.
pub struct PermissionChannelPair {
    pub sender: Sender<PermissionsResponse>,
    pub receiver: Receiver<PermissionsResponse>,
}

/// Maps worker thread tokens (u64) to their permission channel pairs.
pub static PERMISSION_CHANNELS: LazyLock<Mutex<HashMap<u64, PermissionChannelPair>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

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
