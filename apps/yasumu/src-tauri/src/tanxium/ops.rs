use crate::tanxium::state::get_renderer_event_sender;
use crate::tanxium::types::AppHandleState;
use deno_core::op2;
use deno_core::OpState;
use tauri::Emitter;

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
    ops = [op_send_renderer_event],
    esm_entry_point = "ext:tanxium_rt/bootstrap.ts",
    esm = [
        dir "src/tanxium/runtime",
        "bootstrap.ts",
        "ui.ts",
        "patches.ts",
    ],
    state = |state| {
        state.put::<deno_runtime::ops::bootstrap::SnapshotOptions>(
            deno_runtime::ops::bootstrap::SnapshotOptions::default(),
        );
    },
);
