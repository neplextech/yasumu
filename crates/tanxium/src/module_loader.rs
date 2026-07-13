use std::borrow::Cow;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::{cell::RefCell, collections::HashMap, rc::Rc};

use deno_ast::{
    JsxAutomaticOptions, JsxRuntime, MediaType, ModuleSpecifier, ParseParams, SourceMapOption,
};
use deno_core::ModuleLoadReferrer;
use deno_runtime::deno_core::ModuleSourceCode;
use deno_runtime::deno_core::ModuleType;
use deno_runtime::deno_core::error::ModuleLoaderError;
use deno_runtime::deno_core::futures::executor::block_on;
use deno_runtime::deno_core::{
    ModuleLoadOptions, ModuleLoadResponse, ModuleLoader, ModuleSource, ResolutionKind,
    resolve_import,
};
use deno_runtime::deno_web::{Blob, BlobStore};
use node_resolver::{NodeResolutionKind, PackageJsonResolver, ResolutionMode};
use sys_traits::impls::RealSys;
use tracing::trace;

use crate::{node_services, state::RuntimeState, yasumu_modules::YASUMU_MODULES};

const YASUMU_MODULE_PREFIX: &str = "yasumu:";
const YASUMU_INTERNAL_PREFIX: &str = "file://yasumu_internal/";
const YASUMU_VIRTUAL_PREFIX: &str = "yasumu:virtual/";

type SourceMapStore = Rc<RefCell<HashMap<String, Vec<u8>>>>;
type VirtualModulesStore = Arc<Mutex<HashMap<String, String>>>;

fn parse_data_url(specifier: &str) -> Option<(String, String)> {
    let rest = specifier.strip_prefix("data:")?;
    let comma = rest.find(',')?;
    let metadata = &rest[..comma];
    let encoded = &rest[comma + 1..];

    let is_base64 = metadata.ends_with(";base64");
    let mime = if is_base64 {
        metadata.strip_suffix(";base64").unwrap_or(metadata)
    } else {
        metadata
    };

    let decoded = if is_base64 {
        use base64::Engine;
        let bytes = base64::engine::general_purpose::STANDARD
            .decode(encoded)
            .ok()?;
        String::from_utf8(bytes).ok()?
    } else {
        urlencoding::decode(encoded).ok()?.into_owned()
    };

    Some((mime.to_string(), decoded))
}

fn media_type_from_content_type(content_type: Option<&str>) -> (MediaType, bool, ModuleType) {
    let normalized = content_type
        .and_then(|value| value.split(';').next())
        .map(str::trim)
        .map(str::to_ascii_lowercase);

    if normalized
        .as_deref()
        .is_some_and(|content_type| content_type.ends_with("+json"))
    {
        return (MediaType::Json, false, ModuleType::Json);
    }

    match normalized.as_deref() {
        Some("application/typescript") | Some("text/typescript") => {
            (MediaType::TypeScript, true, ModuleType::JavaScript)
        }
        Some("application/tsx") | Some("text/tsx") => {
            (MediaType::Tsx, true, ModuleType::JavaScript)
        }
        Some("application/jsx") | Some("text/jsx") => {
            (MediaType::Jsx, true, ModuleType::JavaScript)
        }
        Some("application/json") | Some("text/json") => (MediaType::Json, false, ModuleType::Json),
        Some("application/ecmascript")
        | Some("application/javascript")
        | Some("text/ecmascript")
        | Some("text/javascript")
        | None
        | Some(_) => (MediaType::JavaScript, false, ModuleType::JavaScript),
    }
}

fn is_common_js_module(path: &Path) -> bool {
    match path.extension().and_then(|extension| extension.to_str()) {
        Some("cjs") => return true,
        Some("mjs") => return false,
        Some("js") => {}
        _ => return false,
    }

    let mut directory = path.parent();
    while let Some(current) = directory {
        let package_json = current.join("package.json");
        if let Ok(content) = std::fs::read_to_string(package_json) {
            return serde_json::from_str::<serde_json::Value>(&content)
                .ok()
                .and_then(|package| package.get("type")?.as_str().map(str::to_owned))
                .as_deref()
                != Some("module");
        }
        directory = current.parent();
    }

    false
}

/// Finds statically declared CommonJS property exports.
///
/// Node exposes these properties as synthetic named exports when a CommonJS
/// module is imported from ESM. Supporting the common assignment forms here
/// keeps Tanxium's ESM interop aligned with Node without evaluating the module
/// during module loading.
fn common_js_named_exports(code: &str) -> Vec<String> {
    let bytes = code.as_bytes();
    let mut exports = Vec::new();
    let mut offset = 0;

    while let Some(index) = code[offset..].find("exports.") {
        let exports_start = offset + index;
        let is_module_exports = exports_start >= "module.".len()
            && &code[exports_start - "module.".len()..exports_start] == "module.";
        let is_plain_exports = exports_start == 0
            || !bytes[exports_start - 1].is_ascii_alphanumeric()
                && bytes[exports_start - 1] != b'_'
                && bytes[exports_start - 1] != b'$'
                && bytes[exports_start - 1] != b'.';

        if !is_module_exports && !is_plain_exports {
            offset = exports_start + "exports.".len();
            continue;
        }

        let property_start = exports_start + "exports.".len();
        let Some(first) = bytes.get(property_start) else {
            break;
        };

        if !first.is_ascii_alphabetic() && *first != b'_' && *first != b'$' {
            offset = property_start;
            continue;
        }

        let property_end = bytes[property_start..]
            .iter()
            .position(|byte| !byte.is_ascii_alphanumeric() && *byte != b'_' && *byte != b'$')
            .map(|length| property_start + length)
            .unwrap_or(bytes.len());
        let property = &code[property_start..property_end];

        if !exports.iter().any(|export| export == property) {
            exports.push(property.to_string());
        }

        offset = property_end;
    }

    exports
}

fn wrap_common_js_module(code: String, path: &Path) -> String {
    let filename = serde_json::to_string(&path.to_string_lossy()).unwrap();
    let dirname = serde_json::to_string(&path.parent().unwrap_or(path).to_string_lossy()).unwrap();
    let named_exports = common_js_named_exports(&code)
        .into_iter()
        .map(|name| format!("export const {name} = module.exports.{name};"))
        .collect::<Vec<_>>()
        .join("\n");

    format!(
        r#"import "node:process";
import {{ createRequire }} from "node:module";
const require = createRequire(import.meta.url);
const module = {{ exports: {{}} }};
const exports = module.exports;
const __filename = {filename};
const __dirname = {dirname};
(function (require, module, exports, __filename, __dirname) {{
{code}
}})(require, module, exports, __filename, __dirname);
export default module.exports;
{named_exports}"#,
    )
}

#[cfg(test)]
mod tests {
    use super::common_js_named_exports;

    #[test]
    fn discovers_common_js_property_exports() {
        let exports = common_js_named_exports(
            "exports.answer = 42; module.exports.SMTPServer = SMTPServer; module.exports.answer = 43;",
        );

        assert_eq!(exports, vec!["answer", "SMTPServer"]);
    }
}

pub struct TypescriptModuleLoader {
    pub source_maps: SourceMapStore,
    pub virtual_modules: Option<VirtualModulesStore>,
    pub blob_store: Option<Arc<BlobStore>>,
    /// Keeps the root Blob alive if the caller revokes its object URL directly
    /// after creating a Web Worker.
    pub main_module_blob: Option<(ModuleSpecifier, Arc<Blob>)>,
    pub state: Arc<RuntimeState>,
    pub pkg_json_resolver: Arc<PackageJsonResolver<RealSys>>,
}

impl TypescriptModuleLoader {
    fn current_workspace_dir(&self) -> Option<std::path::PathBuf> {
        self.state
            .context
            .read()
            .expect("runtime context lock poisoned")
            .workspace_dir
            .clone()
    }

    fn resolve_bare_package(&self, specifier: &str) -> Result<ModuleSpecifier, ModuleLoaderError> {
        let workspace_dir = self.current_workspace_dir();
        let base_dir = workspace_dir
            .as_ref()
            .cloned()
            .or_else(|| std::env::current_dir().ok())
            .ok_or_else(|| {
                ModuleLoaderError::type_error("Unable to determine a package resolution directory")
            })?;
        let referrer =
            ModuleSpecifier::from_file_path(base_dir.join("__yasumu_virtual_module__.ts"))
                .map_err(|_| {
                    ModuleLoaderError::type_error("Unable to create a package resolution referrer")
                })?;

        let node_resolver = node_services::create_node_resolver(
            node_services::create_npm_resolver(
                self.pkg_json_resolver.clone(),
                workspace_dir.as_deref(),
            ),
            self.pkg_json_resolver.clone(),
        );

        node_resolver
            .resolve_package(
                specifier,
                &referrer,
                ResolutionMode::Import,
                NodeResolutionKind::Execution,
            )
            .and_then(|resolution| resolution.into_url())
            .map_err(|error| ModuleLoaderError::type_error(error.to_string()))
    }

    fn load_inner(
        &self,
        module_specifier: &ModuleSpecifier,
    ) -> Result<ModuleSource, ModuleLoaderError> {
        trace!("Loading module: {}", module_specifier);

        let is_yasumu_internal = module_specifier.scheme() == "file"
            && module_specifier
                .as_str()
                .starts_with(YASUMU_INTERNAL_PREFIX);

        let is_yasumu_virtual = is_yasumu_internal
            && module_specifier.as_str().starts_with(&format!(
                "{}{}",
                YASUMU_INTERNAL_PREFIX, YASUMU_VIRTUAL_PREFIX
            ));

        let (code, should_transpile, media_type, module_type) = match module_specifier.scheme() {
            "data" => {
                let (mime, decoded) =
                    parse_data_url(module_specifier.as_str()).ok_or_else(|| {
                        ModuleLoaderError::type_error(format!(
                            "Invalid data URL: {}",
                            module_specifier
                        ))
                    })?;

                let (media_type, should_transpile) = if mime.contains("typescript") {
                    (MediaType::TypeScript, true)
                } else {
                    (MediaType::JavaScript, false)
                };

                (
                    decoded,
                    should_transpile,
                    media_type,
                    ModuleType::JavaScript,
                )
            }

            "blob" => {
                let blob = self
                    .main_module_blob
                    .as_ref()
                    .filter(|(specifier, _)| specifier == module_specifier)
                    .map(|(_, blob)| blob.clone())
                    .or_else(|| {
                        self.blob_store
                            .as_ref()
                            .and_then(|store| store.get_object_url(module_specifier.clone()))
                    })
                    .ok_or_else(|| {
                        ModuleLoaderError::type_error(format!(
                            "Blob URL not found: {}",
                            module_specifier
                        ))
                    })?;

                let code = String::from_utf8(block_on(blob.read_all())).map_err(|error| {
                    ModuleLoaderError::type_error(format!(
                        "Blob module is not valid UTF-8: {}",
                        error
                    ))
                })?;
                let (media_type, should_transpile, module_type) =
                    media_type_from_content_type(Some(&blob.media_type));

                (code, should_transpile, media_type, module_type)
            }

            "file" if !is_yasumu_internal => {
                let path = module_specifier.to_file_path().map_err(|_| {
                    ModuleLoaderError::type_error("Could not convert module specifier to file path")
                })?;

                let media_type = MediaType::from_path(&path);
                let (module_type, should_transpile) = match media_type {
                    MediaType::JavaScript | MediaType::Mjs | MediaType::Cjs => {
                        (ModuleType::JavaScript, false)
                    }
                    MediaType::Jsx
                    | MediaType::TypeScript
                    | MediaType::Mts
                    | MediaType::Cts
                    | MediaType::Dts
                    | MediaType::Dmts
                    | MediaType::Dcts
                    | MediaType::Tsx => (ModuleType::JavaScript, true),
                    MediaType::Json => (ModuleType::Json, false),
                    _ => {
                        return Err(ModuleLoaderError::type_error(format!(
                            "Unsupported file extension: {:?}",
                            path.extension()
                        )));
                    }
                };

                let code = std::fs::read_to_string(&path).map_err(ModuleLoaderError::from_err)?;
                let code = if is_common_js_module(&path) {
                    wrap_common_js_module(code, &path)
                } else {
                    code
                };

                (code, should_transpile, media_type, module_type)
            }

            "https" => {
                let url = module_specifier.as_str();
                let response = ureq::get(url)
                    .call()
                    .map_err(|e| ModuleLoaderError::type_error(e.to_string()))?;

                let content_type = response.header("Content-Type").map(str::to_owned);

                let body = response
                    .into_string()
                    .map_err(ModuleLoaderError::from_err)?;

                let (media_type, should_transpile, module_type) =
                    media_type_from_content_type(content_type.as_deref());

                (body, should_transpile, media_type, module_type)
            }

            "file" if is_yasumu_virtual => {
                let full_prefix = format!("{}{}", YASUMU_INTERNAL_PREFIX, YASUMU_VIRTUAL_PREFIX);
                let identifier = module_specifier
                    .as_str()
                    .strip_prefix(&full_prefix)
                    .ok_or_else(|| {
                        ModuleLoaderError::type_error(format!(
                            "Invalid virtual module specifier: {}",
                            module_specifier
                        ))
                    })?;

                let code = self
                    .virtual_modules
                    .as_ref()
                    .and_then(|vm| vm.lock().ok())
                    .and_then(|g| g.get(identifier).cloned())
                    .ok_or_else(|| {
                        ModuleLoaderError::type_error(format!(
                            "Virtual module not found: {}",
                            identifier
                        ))
                    })?;

                (code, true, MediaType::TypeScript, ModuleType::JavaScript)
            }

            "file" if is_yasumu_internal => {
                let key = module_specifier
                    .as_str()
                    .strip_prefix(YASUMU_INTERNAL_PREFIX)
                    .unwrap();
                let source = YASUMU_MODULES.get(key).ok_or_else(|| {
                    ModuleLoaderError::type_error(format!(
                        "Unknown built-in module: {}",
                        module_specifier
                    ))
                })?;

                (
                    source.to_string(),
                    true,
                    MediaType::TypeScript,
                    ModuleType::JavaScript,
                )
            }

            scheme => {
                return Err(ModuleLoaderError::type_error(format!(
                    "Unsupported module scheme: {}",
                    scheme
                )));
            }
        };

        let code = if should_transpile {
            let parsed = deno_ast::parse_module(ParseParams {
                specifier: module_specifier.clone(),
                text: code.into(),
                media_type,
                capture_tokens: false,
                scope_analysis: false,
                maybe_syntax: None,
            })
            .map_err(|e| ModuleLoaderError::type_error(e.to_string()))?;

            let result = parsed
                .transpile(
                    &deno_ast::TranspileOptions {
                        imports_not_used_as_values: deno_ast::ImportsNotUsedAsValues::Remove,
                        decorators: deno_ast::DecoratorsTranspileOption::LegacyTypeScript {
                            emit_metadata: true,
                        },
                        jsx: Some(JsxRuntime::Automatic(JsxAutomaticOptions {
                            development: false,
                            import_source: Some("yasumu:ui".to_string()),
                        })),
                        ..Default::default()
                    },
                    &deno_ast::TranspileModuleOptions::default(),
                    &deno_ast::EmitOptions {
                        source_map: SourceMapOption::Separate,
                        inline_sources: true,
                        ..Default::default()
                    },
                )
                .map_err(|e| ModuleLoaderError::type_error(e.to_string()))?
                .into_source();

            if let Some(map) = result.source_map {
                self.source_maps
                    .borrow_mut()
                    .insert(module_specifier.to_string(), map.into_bytes());
            }

            String::from_utf8(result.text.into_bytes()).unwrap()
        } else {
            code
        };

        Ok(ModuleSource::new(
            module_type,
            ModuleSourceCode::String(code.into()),
            module_specifier,
            None,
        ))
    }
}

impl ModuleLoader for TypescriptModuleLoader {
    fn resolve(
        &self,
        specifier: &str,
        referrer: &str,
        _kind: ResolutionKind,
    ) -> Result<ModuleSpecifier, ModuleLoaderError> {
        if specifier.starts_with("data:") {
            return ModuleSpecifier::parse(specifier)
                .map_err(|e| ModuleLoaderError::type_error(e.to_string()));
        }

        if specifier.starts_with(YASUMU_MODULE_PREFIX) {
            let resolved = format!("{}{}", YASUMU_INTERNAL_PREFIX, specifier);
            return resolve_import(&resolved, referrer).map_err(ModuleLoaderError::from_err);
        }

        if !specifier.starts_with('.') && !specifier.starts_with('/') && !specifier.contains(':') {
            return self.resolve_bare_package(specifier);
        }

        resolve_import(specifier, referrer).map_err(ModuleLoaderError::from_err)
    }

    fn load(
        &self,
        module_specifier: &ModuleSpecifier,
        _maybe_referrer: Option<&ModuleLoadReferrer>,
        _options: ModuleLoadOptions,
    ) -> ModuleLoadResponse {
        ModuleLoadResponse::Sync(self.load_inner(module_specifier))
    }

    fn get_source_map(&self, specifier: &str) -> Option<Cow<'_, [u8]>> {
        self.source_maps
            .borrow()
            .get(specifier)
            .cloned()
            .map(Cow::Owned)
    }
}
