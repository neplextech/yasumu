fn main() {
    deno_napi::print_linker_flags("yasumu");
    tauri_build::build()
}
