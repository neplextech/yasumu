# Publishing

`tanxium` and `tanxium-cli` are published through GitHub Actions OIDC
trusted publishing. Before triggering the workflow, configure the same
trusted publisher for both crates in crates.io with:

- repository: `neplextech/yasumu`
- workflow: `.github/workflows/publish-tanxium.yml`
- environment: `crates-io`

The workflow is triggered by `tanxium-v*` tags or manually with an
existing tag name. It requests `id-token: write`, exchanges that
identity with crates.io through `rust-lang/crates-io-auth-action`, and
publishes the library before the CLI using short-lived tokens. It then
builds CLI executables for the supported Linux, macOS, and Windows
targets and attaches them to a draft GitHub Release. No crates.io API
token is stored in GitHub secrets.
