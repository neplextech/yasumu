use std::collections::HashMap;
use std::sync::LazyLock;

const YASUMU_MODULE_ENTRIES: &[(&str, &str)] = &[
    (
        "yasumu:ui/jsx-runtime",
        include_str!("runtime/modules/jsx-runtime.ts"),
    ),
    (
        "yasumu:test",
        include_str!("../../resources/yasumu-scripts/public-modules/yasumu__test/index.js"),
    ),
    (
        "yasumu:collection",
        include_str!("runtime/modules/collection.ts"),
    ),
];

pub static YASUMU_MODULES: LazyLock<HashMap<&'static str, &'static str>> =
    LazyLock::new(|| YASUMU_MODULE_ENTRIES.iter().copied().collect());
