# CLI

The `tanxium` executable runs one JavaScript or TypeScript entrypoint:

```sh
tanxium run script.ts
tanxium run script.ts --workspace ./workspace --resources ./resources
tanxium --no-sandbox run script.ts
tanxium --allow-http-imports run script.ts
```

The CLI sandboxes its main worker by default, so permissions are not
granted until the runtime prompts for them. In an interactive
terminal, Tanxium offers allow-once, allow-all, and deny choices.
Non-interactive runs deny prompts deterministically. Pass
`--sandbox false` or the shorter `--no-sandbox` to grant the main
worker all permissions. Web workers remain sandboxed in either mode.

HTTPS module imports are enabled by default. HTTP imports are disabled
because they are not transport-secure; opt in explicitly with
`--allow-http-imports` when loading trusted local-network or
development modules.

Both flags default to the process working directory. The CLI uses the
same Yasumu bootstrap as library embedders. Runtime failures are
written to standard error.

Pass `--verbose` to `run` or `repl` to print runtime renderer events
(for example, structured console and notification events). They are
suppressed by default so normal script output stays readable.

## REPL

Run `tanxium repl` (or simply `tanxium`) for an interactive session.
The REPL accepts multiline input: press Enter on a blank line to
evaluate. Top-level `await` is supported.

```text
> const answer = await Promise.resolve(
…   42,
… );
…
42
```

Commands: `.help`, `.clear`, `.exit`, and `.quit`.
