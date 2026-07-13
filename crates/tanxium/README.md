# Tanxium

Tanxium is an embeddable JavaScript and TypeScript runtime built on Deno. It provides the Yasumu runtime APIs without depending on Tauri, so desktop, CLI, and headless hosts can use the same script contract.

```sh
cargo install --git https://github.com/neplextech/yasumu tanxium-cli
tanxium repl
tanxium run script.ts
```

See [`docs/embedding.md`](docs/embedding.md) for the library API and [`docs/cli.md`](docs/cli.md) for the bundled CLI.
