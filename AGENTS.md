# AGENTS.md

# Yasumu contributor and agent guide

## Overview

Yasumu is a desktop-first API development and testing platform.

The project consists of three major layers:

- **Yasumu**: the desktop application (Next.js + Tauri)
- **Tanxium**: an embeddable JavaScript/TypeScript runtime
- **Shared packages**: schemas, RPC contracts, UI, utilities and
  testing

This repository is simultaneously:

- a pnpm workspace
- a Cargo workspace

Both ecosystems are first-class citizens. Changes should preserve
clear boundaries between them.

---

# Repository layout

```text
apps/
  docs/                 Documentation site
  www/                  Marketing website
  yasumu/               Desktop frontend (Next.js)
    src-tauri/          Yasumu application crate

crates/
  tanxium/              Runtime library (publishable)
  tanxium-cli/          CLI + REPL
  tanxium-yasumu/       Tauri adapter

packages/
  common/               Shared utilities
  core/                 RPC client
  rpc/                  RPC contract definitions
  schema/               YSL schema
  tanxium/              Runtime bootstrap package
  test/                 Script testing APIs
  ui/                   Shared UI
  ...                   Other packages that are shared in this monorepo

tests/
  tanxium-runtime/      Runtime semantic tests

Cargo.toml
pnpm-workspace.yaml
```

---

# Core architecture

The long-term architecture is intentionally layered.

```
Next.js UI
      │
packages/core
      │
packages/rpc
      │
Tauri Commands
      │
tanxium-yasumu
      │
crates/tanxium
      │
Embedded Deno Runtime
```

Every dependency should flow downward.

Do **not** introduce reverse dependencies.

Do **not** create circular dependencies.

Do **not** bypass layers because it is "simpler."

---

# Design principles

Prefer long-term maintainability over short-term convenience.

The codebase values:

- explicit APIs
- predictable ownership
- minimal abstractions
- runtime independence
- strong typing
- low coupling

If multiple implementations need the same behavior, move the shared
logic to the correct layer instead of duplicating it.

---

# Coding guidelines

## General

- NEVER duplicate code.
- NEVER introduce helper functions that only wrap trivial expressions.
- NEVER add unnecessary abstractions.
- Prefer explicit code over clever code.
- Prefer composition over inheritance.
- Prefer data-oriented designs over deeply nested object hierarchies.

## TypeScript

- Avoid `any`.
- Avoid `unknown` in public APIs unless unavoidable.
- Prefer generics.
- Prefer discriminated unions.
- Avoid unnecessary type assertions.

## Rust

- Prefer ownership over unnecessary `Arc<Mutex<...>>`.
- Keep APIs small.
- Minimize trait complexity unless it improves extensibility.
- Avoid unnecessary heap allocations.

---

# Package boundaries

## packages/rpc

Contains only RPC contracts.

It must remain:

- runtime-independent
- application-independent
- UI-independent

Do not add business logic.

---

## packages/core

Contains typed client implementations.

Business logic belongs here, not inside `packages/rpc`.

---

## packages/common

Only lightweight shared types and utilities.

Avoid feature creep.

---

## crates/tanxium

This is the runtime.

It owns:

- runtime state
- Deno workers
- module loading
- virtual modules
- `yasumu:*`
- runtime APIs
- bootstrap
- execution lifecycle

It must **never** depend on:

- Tauri
- React
- Next.js
- desktop UI concepts

Everything here should be embeddable.

---

## crates/tanxium-yasumu

This crate adapts Tanxium to Yasumu.

It translates:

- dialogs
- filesystem access
- runtime events
- permissions
- application state
- window integration

It should contain **no runtime logic**.

If runtime behavior changes, it belongs in `crates/tanxium`.

---

## crates/tanxium-cli

The CLI exists to execute the exact same runtime.

CLI-specific behavior is acceptable.

Runtime-specific behavior is not.

The CLI should be treated as another runtime host.

---

# Runtime architecture

Tanxium is designed to be runtime-agnostic.

The runtime should not assume it is executing inside Yasumu.

New capabilities should first be designed as generic runtime APIs.

Host integrations should adapt those APIs rather than extending the
runtime with application-specific behavior.

When introducing a runtime feature:

1. implement it inside `crates/tanxium`
2. expose generic APIs
3. adapt them in `tanxium-yasumu`
4. verify the CLI behaves identically
5. add semantic runtime tests

---

# Testing philosophy

Behavior matters.

Implementation details do not.

Avoid tests that inspect source code.

Prefer tests that execute the real runtime.

Runtime tests should verify:

- execution
- permissions
- virtual modules
- node_modules resolution
- renderer communication
- worker lifecycle
- REPL behavior

---

# Documentation

Whenever a public feature changes:

Update:

- `apps/docs`
- `crates/tanxium/docs`
- `crates/tanxium/README.md`

Public Rust APIs should include rustdoc.

Examples are preferred over long explanations.

---

# Validation

Run commands from the repository root.

## Rust

```sh
cargo fmt --all
cargo check --workspace
cargo package --allow-dirty --no-verify -p tanxium
```

## JavaScript

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm format
```

## Runtime

```sh
pnpm --filter @yasumu/tanxium-runtime-tests test
```

---

# Releases

Desktop releases:

- `.github/workflows/release.yml`
- `.github/workflows/canary.yml`

Rust CI:

- `.github/workflows/cargo.yml`

Publishing:

- `.github/workflows/publish-tanxium.yml`

Use crates.io Trusted Publishing.

Never introduce long-lived crates.io API tokens.

---

# Code review expectations

Before making architectural changes:

- understand the existing layer ownership
- preserve dependency direction
- avoid introducing coupling between unrelated packages

When code-review graph tools are available, prefer them over
repository-wide searches.

Otherwise use targeted `rg` searches.

---

# What not to do

Do not:

- duplicate runtime implementations
- bypass RPC layers
- place runtime logic inside Tauri
- place Tauri logic inside Tanxium
- couple shared packages to application code
- introduce circular dependencies
- add abstractions without multiple concrete use cases
- optimize prematurely
- change public APIs without updating documentation and runtime tests
