# Yasumu CLI

Command-line interface for Yasumu - execute and manage your API workspaces from the terminal.

## Installation

```bash
npm install -g yasumu
# or
pnpm add -g yasumu
```

## Commands

### `yasumu info`

Display information about the Yasumu workspace.

```bash
yasumu info [options]
```

**Options:**

- `-p, --path <path>` - Path to the workspace directory (default: current directory)
- `--json` - Output as JSON

**Example:**

```bash
yasumu info
yasumu info --path /path/to/project
yasumu info --json
```

### `yasumu rest list`

List all REST entities in the workspace.

```bash
yasumu rest list [options]
```

**Options:**

- `-p, --path <path>` - Path to the workspace directory
- `--json` - Output as JSON

### `yasumu rest run`

Execute REST entities.

```bash
yasumu rest run [target] [options]
```

**Arguments:**

- `target` - Entity name or ID to run (optional if using `--all`)

**Options:**

- `-p, --path <path>` - Path to the workspace directory
- `-a, --all` - Run all REST entities
- `--no-script` - Skip pre/post request scripts
- `-e, --env <environment>` - Environment name or ID to use
- `-v, --verbose` - Show detailed response information (headers, body)
- `--json` - Output results as JSON

## Script Execution

The CLI supports executing pre-request (`onRequest`) and post-response (`onResponse`) scripts defined in your `.ysl` files. Scripts are executed using Node.js's `vm` module with a sandboxed context.

### Supported Script Features

- **`onRequest(req)`** - Executed before the request is sent. Can modify headers, URL, and body.
- **`onResponse(req, res)`** - Executed after receiving the response. Can access response data.
- **Mock Responses** - Return a `YasumuResponse` from `onRequest` to skip the actual HTTP request.
- **Environment Access** - Access variables and secrets via `req.env.getVariable()` and `req.env.getSecret()`.

### Script Globals

The following globals are available in scripts:

- `Yasumu.cuid()` - Generate a unique ID
- `Yasumu.ui.showNotification()` - No-op in CLI (for compatibility)
- `YasumuResponse` - Create mock responses
- `console` - Standard console methods
- `fetch`, `URL`, `URLSearchParams`, `Headers`, `Request`, `Response`
- `JSON`, `Date`, `Math`, `crypto`, `Promise`, `Map`, `Set`

### TypeScript Support

Scripts can use TypeScript syntax (interfaces, type annotations). The CLI automatically strips TypeScript-specific syntax before execution.

**Note:** Some advanced TypeScript features may not be fully supported. For complex scripts, consider using plain JavaScript.

**Examples:**

```bash
# Run a single entity by name
yasumu rest run "Get User"

# Run by ID
yasumu rest run abc123xyz

# Run all entities
yasumu rest run --all

# Run with environment
yasumu rest run "Get User" -e Production

# Run with verbose output
yasumu rest run "Get User" -e Production -v

# Run all and output as JSON
yasumu rest run --all --json
```

## Environment Variables

Yasumu environments support both **variables** and **secrets**. Variables are stored in `.ysl` files and are safe to commit to version control. Secrets, however, are sensitive values that should not be committed.

### Secret Injection from Environment

Since secrets are not stored in `.ysl` files (they appear as empty strings), the CLI provides a mechanism to inject secret values from system environment variables.

**Convention:** `YASUMU_ENV_<SECRET_KEY>` maps to `env.secrets.<SECRET_KEY>`

**Example:**

If your environment has a secret named `ACCESS_TOKEN`, set the corresponding environment variable:

```bash
export YASUMU_ENV_ACCESS_TOKEN="your-secret-token"
```

When you run a request with that environment, the CLI will automatically inject the value:

```bash
yasumu rest run "Protected Endpoint" -e Production
```

The `{{ACCESS_TOKEN}}` placeholder in your request will be replaced with the value from `YASUMU_ENV_ACCESS_TOKEN`.

### Multiple Secrets

You can set multiple secrets:

```bash
export YASUMU_ENV_API_KEY="sk-123456"
export YASUMU_ENV_AUTH_TOKEN="bearer-token-here"
export YASUMU_ENV_DATABASE_URL="postgres://..."
```

### CI/CD Integration

This pattern works well with CI/CD systems where secrets are managed externally:

```yaml
# GitHub Actions example
env:
  YASUMU_ENV_API_KEY: ${{ secrets.API_KEY }}
  YASUMU_ENV_AUTH_TOKEN: ${{ secrets.AUTH_TOKEN }}

steps:
  - run: yasumu rest run --all -e Production
```

## Variable Substitution

The CLI supports variable substitution using the `{{VARIABLE_NAME}}` syntax. Variables are resolved from:

1. Environment variables (from the selected environment's `variables` block)
2. Environment secrets (from `YASUMU_ENV_*` system environment variables)

**Example URL with variables:**

```
https://api.example.com/users/{{USER_ID}}?token={{ACCESS_TOKEN}}
```

## Exit Codes

- `0` - Success (all requests passed)
- `1` - Failure (one or more requests failed, or workspace not found)

## License

AGPL-3.0
