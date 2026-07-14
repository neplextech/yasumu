# Tanxium CLI

`tanxium` executes JavaScript and TypeScript using the embeddable
[Tanxium](https://crates.io/crates/tanxium) runtime.

```sh
cargo install tanxium-cli
tanxium run script.ts
tanxium repl
```

The CLI starts its main worker sandboxed by default and prompts for
permissions in an interactive terminal. Pass `--no-sandbox` when the
entrypoint is trusted and should receive all permissions.

```sh
tanxium --no-sandbox run script.ts
tanxium run script.ts --workspace ./workspace --resources ./resources
tanxium --allow-http-imports run script.ts
```

HTTPS imports are enabled by default. HTTP imports require
`--allow-http-imports` because they are not transport-secure.

See the [Tanxium repository](https://github.com/neplextech/yasumu/tree/main/crates/tanxium)
for embedding guidance, the permission model, and the complete CLI reference.
