# Yasumu application guide

This directory contains the Next.js desktop frontend and the Tauri
application crate. Read the root [`AGENTS.md`](../../AGENTS.md) first
for workspace-wide architecture, Cargo commands, and Tanxium
boundaries.

## Frontend architecture

The frontend uses the Next.js App Router. Follow the project
conventions and consult the installed Next.js documentation when
working on framework-specific behavior.

## Native runtime integration

`src-tauri` is a member of the root Cargo workspace. Run Cargo
commands from the repository root so the Tanxium crates and
application compile together.

Do not add runtime implementation files back under `src-tauri/src`.
The app consumes `tanxium-yasumu`; generic runtime behavior belongs in
`crates/tanxium`, and Tauri-specific behavior belongs in
`crates/tanxium-yasumu`.
