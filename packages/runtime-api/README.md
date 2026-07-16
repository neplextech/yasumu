# `@yasumu/runtime-api`

The canonical script-facing API and serialized protocol shared by Yasumu's
headless executor, Node.js worker adapter, and Tanxium adapter.

The wire-level hook, module, capability, host-call, and message names originate
in `contract/runtime-api.json`. Run `pnpm generate` after changing that file.
The generator updates both TypeScript bindings and Tanxium's Rust/TypeScript
bindings. `pnpm check:generated` fails when committed output is stale.

Application or persistence behavior does not belong in this package.
