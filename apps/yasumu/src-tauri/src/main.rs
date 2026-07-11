#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(debug_assertions)]
    unsafe {
        const LOOPBACKS: &str = "localhost,127.0.0.1,::1";

        std::env::set_var("NO_PROXY", LOOPBACKS);
        std::env::set_var("no_proxy", LOOPBACKS);
    }

    yasumu_lib::run()
}
