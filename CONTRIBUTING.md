# Contributing to Yasumu

Thanks for contributing to Yasumu. Start with an issue or discussion
when the scope is unclear, and check existing pull requests before
starting work on a large change.

## Repository overview

Yasumu has two coordinated workspaces:

- **pnpm workspace**: Next.js applications and TypeScript packages.
- **Cargo workspace**: the Yasumu Tauri application and the Tanxium
  runtime crates.

The root [`AGENTS.md`](AGENTS.md) is the authoritative repository map
and architecture guide. Read it before changing package boundaries,
the Tauri app, or Tanxium.

## Local setup

Install current stable Rust, Node.js, pnpm 11, and Deno 2.9.2. Then
run:

```sh
pnpm install
cargo check --workspace
```

## Working on Tanxium

Tanxium is an embeddable Deno-based JS/TS runtime:

- `crates/tanxium` is the publishable, Tauri-free core.
- `crates/tanxium-yasumu` is the Tauri adapter.
- `crates/tanxium-cli` contains the `tanxium` CLI and REPL.
- `tests/tanxium-runtime` contains Vitest tests that execute the
  actual CLI.

Do not add Tauri dependencies to `crates/tanxium`. Put host-specific
behavior behind `RuntimeHost` and implement it in an adapter. Changes
to module loading, runtime ops, bootstrap code, virtual modules, CLI
behavior, or the REPL require semantic tests in
`tests/tanxium-runtime`.

```sh
cargo fmt --all
cargo check --workspace
pnpm --filter @yasumu/tanxium-runtime-tests test
```

Public `tanxium` API changes require rustdoc and updates to
`crates/tanxium/README.md` or `crates/tanxium/docs/`. Public Yasumu
behavior also belongs in `apps/docs`.

## Testing and formatting

Use the narrowest relevant checks while iterating, then run the
workspace checks before opening a pull request:

```sh
pnpm format
pnpm build
cargo fmt --all --check
cargo check --workspace
pnpm --filter @yasumu/tanxium-runtime-tests test
```

The GitHub Actions workflows in `.github/workflows/` use the root
Cargo workspace. Do not add `working-directory: apps/yasumu/src-tauri`
to generic Cargo jobs; use the root manifest so all crates remain
checked.

## Commits and pull requests

Use [Conventional Commits](https://www.conventionalcommits.org/), for
example:

```text
feat(tanxium): add persistent inspector session
fix(runtime): resolve workspace packages from node_modules
docs: clarify trusted publishing setup
```

Keep pull requests focused. Include the behavior changed, validation
performed, and any migration or release impact in the description. For
a breaking public API change, use `!` in the commit type and include a
`BREAKING CHANGE:` footer.
