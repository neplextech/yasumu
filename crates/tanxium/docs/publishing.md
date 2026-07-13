# Publishing

`tanxium` is published through GitHub Actions OIDC trusted publishing.
Before triggering the workflow, configure a trusted publisher for the
`tanxium` crate in crates.io with:

- repository: `neplextech/yasumu`
- workflow: `.github/workflows/publish-tanxium.yml`
- environment: `crates-io`

The workflow is triggered by `tanxium-v*` tags or manually. It
requests `id-token: write`, exchanges that identity with crates.io
through `rust-lang/crates-io-auth-action`, then runs `cargo publish`
using the short-lived token. No crates.io API token is stored in
GitHub secrets.
