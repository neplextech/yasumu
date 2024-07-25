use mailin_embedded::{response, Handler, Response, Server};
use std::collections::VecDeque;
use std::io::Error;
use std::sync::{Arc, RwLock};
use tauri::{Emitter, State};
use tokio::task::JoinHandle;

#[derive(Clone)]
pub struct SmtpHandler {
    messages: Arc<RwLock<VecDeque<String>>>,
    window: Option<tauri::Window>,
    current_data: Arc<RwLock<String>>,
}

impl SmtpHandler {
    fn new(window: Option<tauri::Window>) -> Self {
        SmtpHandler {
            messages: Arc::new(RwLock::new(VecDeque::new())),
            window,
            current_data: Arc::new(RwLock::new(String::new())),
        }
    }

    fn get_messages(&self) -> Vec<String> {
        self.messages.read().unwrap().clone().into()
    }

    fn set_window(&mut self, window: tauri::Window) {
        self.window = Some(window);
    }

    fn emit_new_email(&self) {
        if let Some(window) = &self.window {
            window.emit("new-email", ()).expect("Failed to emit event");
        }
    }
}

impl Handler for SmtpHandler {
    fn auth_login(&mut self, _username: &str, _password: &str) -> mailin_embedded::Response {
        response::AUTH_OK
    }

    fn auth_plain(
        &mut self,
        _authorization_id: &str,
        _authentication_id: &str,
        _password: &str,
    ) -> Response {
        response::AUTH_OK
    }

    fn data_start(
        &mut self,
        _domain: &str,
        _from: &str,
        _is8bit: bool,
        _to: &[String],
    ) -> Response {
        let mut current_data = self.current_data.write().unwrap();
        *current_data = String::new();
        response::OK
    }

    fn data(&mut self, buf: &[u8]) -> Result<(), Error> {
        let data_str = String::from_utf8_lossy(buf).to_string();
        let mut current_data = self.current_data.write().unwrap();
        current_data.push_str(&data_str);
        Ok(())
    }

    // TODO: parse properly
    fn data_end(&mut self) -> Response {
        let accumulated_str = self.current_data.read().unwrap().clone();
        self.messages.write().unwrap().push_back(accumulated_str);
        self.emit_new_email();

        response::OK
    }
}

pub struct ServerState {
    handle: RwLock<Option<JoinHandle<()>>>,
    handler: RwLock<SmtpHandler>,
}

impl ServerState {
    pub fn new() -> Self {
        ServerState {
            handle: RwLock::new(None),
            handler: RwLock::new(SmtpHandler::new(None)),
        }
    }

    pub fn set_window(&self, window: tauri::Window) {
        let mut handler = self.handler.write().unwrap();
        handler.set_window(window);
    }

    pub fn get_handler(&self) -> SmtpHandler {
        self.handler.read().unwrap().clone()
    }
}

#[tauri::command]
pub async fn start_smtp_server(state: State<'_, ServerState>, port: u32) -> Result<(), String> {
    let mut handle_guard = state.handle.write().unwrap();

    if handle_guard.is_some() {
        return Err("Server is already running".into());
    }

    let handler = state.get_handler();
    let addr = format!("127.0.0.1:{}", port);

    let handle = tokio::spawn(async move {
        let mut server = Server::new(handler);
        server.with_addr(addr).expect("Failed to set address");
        server.serve().expect("Failed to start server");
    });

    *handle_guard = Some(handle);
    Ok(())
}

#[tauri::command]
pub async fn stop_smtp_server(
    window: tauri::Window,
    state: State<'_, ServerState>,
) -> Result<(), String> {
    state.set_window(window);
    let mut handle_guard = state.handle.write().unwrap();

    if let Some(handle) = handle_guard.take() {
        handle.abort();
        return Ok(());
    }

    Err("Server is not running".into())
}

#[tauri::command]
pub fn get_emails(state: State<'_, ServerState>) -> Vec<String> {
    state.get_handler().get_messages()
}
