use std::borrow::Cow;
use std::{cell::RefCell, collections::HashMap, rc::Rc};

use deno_ast::ModuleSpecifier;
use deno_ast::ParseParams;
use deno_ast::SourceMapOption;
use deno_ast::{JsxPrecompileOptions, JsxRuntime, MediaType};
use deno_core::ModuleLoadReferrer;
use deno_runtime::deno_core::error::ModuleLoaderError;
use deno_runtime::deno_core::ModuleSourceCode;
use deno_runtime::deno_core::ModuleType;
use deno_runtime::deno_core::{
    resolve_import, ModuleLoadResponse, ModuleLoader, ModuleSource, RequestedModuleType,
    ResolutionKind,
};

use crate::tanxium::yasumu_modules::YASUMU_MODULES;

const YASUMU_MODULE_PREFIX: &str = "yasumu:";
const YASUMU_INTERNAL_PREFIX: &str = "file://yasumu_internal/";

type SourceMapStore = Rc<RefCell<HashMap<String, Vec<u8>>>>;

pub struct TypescriptModuleLoader {
    pub source_maps: SourceMapStore,
}

impl ModuleLoader for TypescriptModuleLoader {
    fn resolve(
        &self,
        specifier: &str,
        referrer: &str,
        _kind: ResolutionKind,
    ) -> Result<ModuleSpecifier, ModuleLoaderError> {
        // handle yasumu: prefixed modules
        if specifier.starts_with(YASUMU_MODULE_PREFIX) {
            let resolved_specifier = format!("{}{}", YASUMU_INTERNAL_PREFIX, specifier);
            resolve_import(resolved_specifier.as_str(), referrer)
                .map_err(|e| ModuleLoaderError::from_err(e))
        } else {
            resolve_import(specifier, referrer).map_err(|e| ModuleLoaderError::from_err(e))
        }
    }

    fn load(
        &self,
        module_specifier: &ModuleSpecifier,
        _maybe_referrer: Option<&ModuleLoadReferrer>,
        _is_dyn_import: bool,
        _requested_module_type: RequestedModuleType,
    ) -> ModuleLoadResponse {
        let source_maps = self.source_maps.clone();
        fn load(
            source_maps: SourceMapStore,
            module_specifier: &ModuleSpecifier,
        ) -> Result<ModuleSource, ModuleLoaderError> {
            println!("load: {}", module_specifier);

            let is_yasumu_internal = module_specifier.scheme() == "file"
                && module_specifier
                    .to_string()
                    .starts_with(YASUMU_INTERNAL_PREFIX);

            let (code, should_transpile, media_type, module_type) =
                if module_specifier.scheme() == "file" && !is_yasumu_internal {
                    let path = module_specifier.to_file_path().map_err(|_| {
                        ModuleLoaderError::type_error(
                            "There was an error converting the module specifier to a file path",
                        )
                    })?;

                    let media_type = MediaType::from_path(&path);
                    let (module_type, should_transpile) = match MediaType::from_path(&path) {
                        MediaType::JavaScript | MediaType::Mjs | MediaType::Cjs => {
                            (ModuleType::JavaScript, false)
                        }
                        MediaType::Jsx => (ModuleType::JavaScript, true),
                        MediaType::TypeScript
                        | MediaType::Mts
                        | MediaType::Cts
                        | MediaType::Dts
                        | MediaType::Dmts
                        | MediaType::Dcts
                        | MediaType::Tsx => (ModuleType::JavaScript, true),
                        MediaType::Json => (ModuleType::Json, false),
                        _ => (ModuleType::Other("Unknown".into()), false),
                    };

                    if module_type == ModuleType::Other("Unknown".into()) {
                        return Err(ModuleLoaderError::type_error(format!(
                            "Unknown extension {:?}",
                            path.extension()
                        )));
                    }

                    (
                        std::fs::read_to_string(&path)
                            .map_err(|e| ModuleLoaderError::from_err(e))?,
                        should_transpile,
                        media_type,
                        module_type,
                    )
                } else if module_specifier.scheme() == "https" {
                    let url = module_specifier.to_string();

                    let response = ureq::get(&url)
                        .call()
                        .map_err(|e| ModuleLoaderError::type_error(e.to_string()))?
                        .into_string()
                        .map_err(|e| ModuleLoaderError::from_err(e))?;

                    (
                        response,
                        false,
                        MediaType::JavaScript,
                        ModuleType::JavaScript,
                    )
                } else if is_yasumu_internal {
                    let specifier = module_specifier.to_string();
                    let parsed_specifier = specifier.strip_prefix(YASUMU_INTERNAL_PREFIX).unwrap();
                    let module = YASUMU_MODULES.get(parsed_specifier).ok_or_else(|| {
                        ModuleLoaderError::type_error(format!(
                            "Unknown yasumu module: {}",
                            module_specifier.to_string()
                        ))
                    })?;

                    (
                        module.to_string(),
                        true,
                        MediaType::TypeScript,
                        ModuleType::JavaScript,
                    )
                } else {
                    return Err(ModuleLoaderError::type_error(format!(
                        "Unknown scheme {:?}",
                        module_specifier.scheme()
                    )));
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
                let res = parsed
                    .transpile(
                        &deno_ast::TranspileOptions {
                            imports_not_used_as_values: deno_ast::ImportsNotUsedAsValues::Remove,
                            decorators: deno_ast::DecoratorsTranspileOption::LegacyTypeScript {
                                emit_metadata: true,
                            },
                            jsx: Some(JsxRuntime::Precompile(JsxPrecompileOptions {
                                automatic: deno_ast::JsxAutomaticOptions {
                                    development: false,
                                    import_source: Some("yasumu:ui".to_string()),
                                },
                                dynamic_props: None,
                                skip_elements: None,
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
                    .map_err(|e| ModuleLoaderError::type_error(e.to_string()))?;
                let res = res.into_source();
                let source_map = res.source_map.unwrap();
                source_maps
                    .borrow_mut()
                    .insert(module_specifier.to_string(), source_map.into_bytes());
                String::from_utf8(res.text.into_bytes()).unwrap()
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

        ModuleLoadResponse::Sync(load(source_maps, module_specifier))
    }

    fn get_source_map(&self, specifier: &str) -> Option<Cow<'_, [u8]>> {
        self.source_maps
            .borrow()
            .get(specifier)
            .cloned()
            .map(|v| Cow::Owned(v))
    }
}
