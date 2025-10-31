use crate::tanxium::state::{get_renderer_event_sender, EVENT_LISTENER_RESOURCE_ID};
use crate::tanxium::types::AppHandleState;
use deno_core::op2;
use deno_core::v8;
use deno_core::OpState;
use deno_core::Resource;
use deno_core::ResourceId;
use std::cell::RefCell;
use tauri::Emitter;

pub struct EventCallback {
    callback: RefCell<Option<v8::Global<v8::Function>>>,
}

impl Resource for EventCallback {}

impl EventCallback {
    pub fn new(callback: v8::Global<v8::Function>) -> Self {
        Self {
            callback: RefCell::new(Some(callback)),
        }
    }

    pub fn get(&self) -> Option<v8::Global<v8::Function>> {
        self.callback.borrow().clone()
    }
}

#[op2]
#[smi]
fn op_register_renderer_event_listener(
    state: &mut OpState,
    #[global] callback: v8::Global<v8::Function>,
) -> ResourceId {
    let callback_store = EventCallback::new(callback);
    let resource_id = state.resource_table.add(callback_store);
    *EVENT_LISTENER_RESOURCE_ID.lock().unwrap() = Some(resource_id);
    resource_id
}

#[op2(fast)]
fn op_send_renderer_event(state: &mut OpState, #[string] event: &str) {
    let app_handle = {
        let app_handle_state = state.borrow::<AppHandleState>();
        app_handle_state.app_handle.clone()
    };
    app_handle.emit("tanxium-event", event).unwrap();
}

pub fn invoke_renderer_event_callback(event: &str) {
    if let Some(sender) = get_renderer_event_sender() {
        let _ = sender.send(event.to_string());
    } else {
        eprintln!("No renderer event sender available");
    }
}

deno_core::extension!(
    tanxium_rt,
    ops = [op_send_renderer_event, op_register_renderer_event_listener],
    esm_entry_point = "ext:tanxium_rt/bootstrap.ts",
    esm = [
        dir "src/tanxium/runtime",
        "bootstrap.ts",
        "ui.ts",
    ],
    state = |state| {
        state.put::<deno_runtime::ops::bootstrap::SnapshotOptions>(
            deno_runtime::ops::bootstrap::SnapshotOptions::default(),
        );
    },
);
