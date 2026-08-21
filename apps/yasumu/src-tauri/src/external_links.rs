use tauri::webview::NewWindowResponse;
use tauri::{AppHandle, Runtime, Url};
use tauri_plugin_opener::OpenerExt;
use tracing::error;

fn is_app_url(url: &Url) -> bool {
    url.scheme() == "tauri"
        || url.scheme() == "asset"
        || url.host_str() == Some("tauri.localhost")
        || (cfg!(debug_assertions) && url.host_str() == Some("localhost"))
}

fn is_external_url(url: &Url) -> bool {
    match url.scheme() {
        "http" | "https" => !is_app_url(url),
        "mailto" | "tel" => true,
        _ => false,
    }
}

fn open_external_url<R: Runtime>(app: &AppHandle<R>, url: &Url) {
    if let Err(error) = app.opener().open_url(url.as_str(), None::<&str>) {
        error!(url = %url, %error, "Failed to open external URL");
    }
}

pub fn allow_navigation<R: Runtime>(app: &AppHandle<R>, url: &Url) -> bool {
    if !is_external_url(url) {
        return true;
    }

    open_external_url(app, url);
    false
}

pub fn handle_new_window<R: Runtime>(app: &AppHandle<R>, url: Url) -> NewWindowResponse<R> {
    if is_external_url(&url) {
        open_external_url(app, &url);
        return NewWindowResponse::Deny;
    }

    if is_app_url(&url) {
        NewWindowResponse::Allow
    } else {
        NewWindowResponse::Deny
    }
}
