# Yasumu CLI

The Yasumu CLI loads `.ysl` workspaces through `@yasumu/headless` and executes REST, GraphQL, and SSE entities with the
same request pipeline and script contracts used by other Yasumu hosts. Scripts run in the Node.js worker adapter
provided by `@yasumu/runtime-node`; the CLI does not maintain a separate VM runtime or schema definitions.

Node.js 24 or newer is required.

## Workspace selection

By default, commands load `./yasumu` relative to the current directory. Pass either a project directory or the
`yasumu` directory itself with `--workspace`:

```sh
yasumu validate
yasumu validate --workspace /path/to/project
yasumu validate --workspace /path/to/project/yasumu
```

`--path` remains available as a deprecated alias for compatibility.

## Commands

```sh
yasumu validate
yasumu list [--kind rest|graphql|sse]
yasumu run <entity-name-or-id>
yasumu test [entity-name-or-id]
yasumu sse list
yasumu sse run <entity-name-or-id> --max-events 10
yasumu info
```

With no entity argument, `yasumu test` executes every REST, GraphQL, and SSE entity in deterministic order. The existing
`yasumu rest list` and `yasumu rest run <entity>` commands remain as aliases. `yasumu rest run --all` executes every
REST entity.

Execution options include:

- `-e, --environment <name-or-id>` to select a workspace environment.
- `--dotenv <path>` to load values from one explicit dotenv file.
- `--variable KEY=VALUE` to override a variable. Repeat the option for multiple values. JSON primitives and objects
  are preserved when the value is valid JSON.
- `--secret KEY=VALUE` to supply an execution secret. Repeat the option for multiple values.
- `--timeout <milliseconds>` to set the request and script timeout.
- `--max-events <count>` to stop an SSE stream after the accepted event count.
- `--json` to emit one machine-readable JSON document.
- `--verbose` to include request and response bodies in human-readable output.

The CLI never discovers or loads `.env` files implicitly. A relative `--dotenv` path is resolved from the CLI's
current working directory; absolute paths are accepted unchanged. Effective values use this precedence, from highest
to lowest: explicit `--variable` / `--secret` flags, process environment, the selected dotenv file, then the selected
workspace environment and workspace defaults.

Variables can be supplied as `YASUMU_VAR_<NAME>` process environment variables. Defined workspace secrets use
`YASUMU_ENV_<NAME>`. Plain process names also override matching keys already defined by the selected workspace
environment. Secret values are redacted from results, diagnostics, and logs.

Examples:

```sh
yasumu run "Create user" --environment Staging
yasumu run graphql-user --variable API_URL=https://api.example.com/graphql
yasumu sse run deployment-events --max-events 5 --json
yasumu test --environment CI --dotenv .env.ci --secret API_TOKEN="$API_TOKEN" --json
```

The `sse run` command defaults to ten accepted events. It emits events
incrementally in human output and includes the full event array in JSON
output. `echo.yasumu.local` is resolved to an embedded echo server, so
portable local REST, GraphQL, and SSE fixtures work without the desktop
app.

One ephemeral cookie jar is shared by REST, GraphQL, SSE, and nested
executions during a CLI batch. It applies standard domain, path, expiry,
and security matching but is discarded when the command exits; the CLI
never writes cookie credentials into YSL or a local database.

Workspace-relative binary and multipart file references are confined to the workspace root. Request execution uses
the standard Fetch transport. `SIGINT` cancels the active execution and disposes its worker.

## Exit codes

- `0`: validation or execution succeeded.
- `1`: an execution, HTTP response, or test failed.
- `2`: invalid workspace, entity/environment selection, or command input.
- `130`: execution was cancelled with `SIGINT`.
