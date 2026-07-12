use std::borrow::Cow;
use std::sync::{Arc, Mutex};
use std::{cell::RefCell, collections::HashMap, rc::Rc};

use deno_ast::{
    JsxAutomaticOptions, JsxRuntime, MediaType, ModuleSpecifier, ParseParams, SourceMapOption,
};
use deno_core::ModuleLoadReferrer;
use deno_runtime::deno_core::ModuleSourceCode;
use deno_runtime::deno_core::ModuleType;
use deno_runtime::deno_core::error::ModuleLoaderError;
use deno_runtime::deno_core::{
    ModuleLoadOptions, ModuleLoadResponse, ModuleLoader, ModuleSource, ResolutionKind,
    resolve_import,
};
use tracing::trace;

use crate::tanxium::yasumu_modules::YASUMU_MODULES;

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

pub struct TypescriptModuleLoader {
    pub source_maps: SourceMapStore,
    pub virtual_modules: Option<VirtualModulesStore>,
}

impl TypescriptModuleLoader {
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
            && module_specifier
                .as_str()
                .starts_with(&format!("{}{}", YASUMU_INTERNAL_PREFIX, YASUMU_VIRTUAL_PREFIX));

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

                (decoded, should_transpile, media_type, ModuleType::JavaScript)
            }

            "file" if !is_yasumu_internal => {
                let path = module_specifier.to_file_path().map_err(|_| {
                    ModuleLoaderError::type_error(
                        "Could not convert module specifier to file path",
                    )
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

                let code = std::fs::read_to_string(&path)
                    .map_err(ModuleLoaderError::from_err)?;

                (code, should_transpile, media_type, module_type)
            }

            "https" => {
                let url = module_specifier.as_str();
                let body = ureq::get(url)
                    .call()
                    .map_err(|e| ModuleLoaderError::type_error(e.to_string()))?
                    .into_string()
                    .map_err(ModuleLoaderError::from_err)?;

                (body, false, MediaType::JavaScript, ModuleType::JavaScript)
            }

            "file" if is_yasumu_virtual => {
                let full_prefix =
                    format!("{}{}", YASUMU_INTERNAL_PREFIX, YASUMU_VIRTUAL_PREFIX);
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
                        imports_not_used_as_values:
                            deno_ast::ImportsNotUsedAsValues::Remove,
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
            return resolve_import(&resolved, referrer)
                .map_err(ModuleLoaderError::from_err);
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
