pub static TANXIUM_SNAPSHOT: Option<&[u8]> = Some(include_bytes!(concat!(
    env!("OUT_DIR"),
    "/TANXIUM_SNAPSHOT.bin"
)));

include!(concat!(env!("OUT_DIR"), "/TANXIUM_RESIDUAL_SOURCES.rs"));

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generated_snapshot_is_not_empty() {
        assert!(TANXIUM_SNAPSHOT.is_some_and(|snapshot| !snapshot.is_empty()));
    }

    #[test]
    fn residual_tables_are_sorted() {
        for residuals in [TANXIUM_RESIDUAL_LAZY_JS, TANXIUM_RESIDUAL_LAZY_ESM] {
            assert!(
                residuals.windows(2).all(|pair| pair[0].0 < pair[1].0),
                "residual source table must be strictly sorted"
            );
        }
    }
}
