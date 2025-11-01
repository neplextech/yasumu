use once_cell::sync::Lazy;
use std::collections::HashMap;

pub static YASUMU_MODULES: Lazy<HashMap<&'static str, &'static str>> = Lazy::new(|| {
    HashMap::from([
        // yasumu:module => source file mapping
        (
            "yasumu:ui/jsx-runtime",
            include_str!("runtime/modules/jsx-runtime.ts"),
        ),
    ])
});
