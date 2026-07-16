use std::collections::HashMap;
use std::sync::LazyLock;

use crate::generated_runtime_contract::YASUMU_VIRTUAL_MODULES;

const YASUMU_MODULE_ENTRIES: &[(&str, &str)] = &[
    (
        "yasumu:ui/jsx-runtime",
        include_str!("runtime/modules/jsx-runtime.ts"),
    ),
    ("yasumu:test", include_str!("runtime/modules/test.js")),
    (
        "yasumu:workspace",
        include_str!("runtime/modules/workspace.ts"),
    ),
    ("yasumu:runtime", include_str!("runtime/modules/runtime.ts")),
    ("yasumu:env", include_str!("runtime/modules/env.ts")),
    ("yasumu:files", include_str!("runtime/modules/files.ts")),
    (
        "runtime-api-bridge.ts",
        include_str!("runtime/modules/runtime-api-bridge.ts"),
    ),
    (
        "yasumu:runtime/protocol",
        include_str!("runtime/generated-runtime-protocol.ts"),
    ),
    (
        "yasumu:collection",
        include_str!("runtime/modules/collection.ts"),
    ),
];

pub static YASUMU_MODULES: LazyLock<HashMap<&'static str, &'static str>> = LazyLock::new(|| {
    let modules = YASUMU_MODULE_ENTRIES
        .iter()
        .copied()
        .collect::<HashMap<_, _>>();
    for module in YASUMU_VIRTUAL_MODULES {
        assert!(
            modules.contains_key(module),
            "generated runtime contract module {module} has no Tanxium implementation"
        );
    }
    modules
});

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn implements_every_generated_runtime_module() {
        for module in YASUMU_VIRTUAL_MODULES {
            assert!(YASUMU_MODULES.contains_key(module));
        }
    }
}
