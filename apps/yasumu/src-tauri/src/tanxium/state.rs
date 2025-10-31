use crate::tanxium::types::PermissionsResponse;
use crossbeam_channel::{Receiver, Sender};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::Mutex;
use std::thread;
use tokio::sync::mpsc;

pub static PERMISSION_CHANNELS: Lazy<
    Mutex<HashMap<thread::ThreadId, Sender<PermissionsResponse>>>,
> = Lazy::new(|| Mutex::new(HashMap::new()));

pub static RECEIVER_MAP: Lazy<Mutex<HashMap<thread::ThreadId, Receiver<PermissionsResponse>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

pub static EVENT_LISTENER_RESOURCE_ID: Lazy<Mutex<Option<deno_core::ResourceId>>> =
    Lazy::new(|| Mutex::new(None));

pub static RENDERER_EVENT_SENDER: Lazy<Mutex<Option<tokio::sync::mpsc::UnboundedSender<String>>>> =
    Lazy::new(|| Mutex::new(None));

pub fn init_renderer_event_channel() -> tokio::sync::mpsc::UnboundedReceiver<String> {
    let (tx, rx) = mpsc::unbounded_channel();
    *RENDERER_EVENT_SENDER.lock().unwrap() = Some(tx);
    rx
}

pub fn get_renderer_event_sender() -> Option<tokio::sync::mpsc::UnboundedSender<String>> {
    RENDERER_EVENT_SENDER.lock().unwrap().clone()
}
