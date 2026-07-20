import { Command, CommanderError, Option } from 'commander';

import {
  CliInputError,
  executeBatch,
  executionFailed,
  loadDotenvFile,
  loadWorkspace,
  parseVariableValue,
  resolveCliEnvironment,
  selectEntity,
  selectEnvironment,
  sortedEntities,
} from './application.js';
import { resolveWorkspaceRoot } from './filesystem.js';
import { printCommandError, printExecution, printInfo, printList, printValidation } from './presentation.js';

export const CliExitCodes = {
  Success: 0,
  ExecutionFailed: 1,
  InvalidInput: 2,
  Cancelled: 130,
} as const;

interface ProgramState {
  exitCode: number;
}

interface WorkspaceOptions {
  workspace?: string;
  path?: string;
  json?: boolean;
}

interface ExecutionOptions extends WorkspaceOptions {
  environment?: string;
  env?: string;
  dotenv?: string;
  variable?: string[];
  secret?: string[];
  timeout?: string;
  maxEvents?: string;
  verbose?: boolean;
}

interface LegacyRestOptions extends ExecutionOptions {
  all?: boolean;
  script?: boolean;
}

export function createProgram(state: ProgramState = { exitCode: CliExitCodes.Success }): Command {
  const program = new Command();
  program
    .name('yasumu')
    .description('Execute and validate Yasumu workspaces through the shared headless runtime')
    .version('0.0.1')
    .showHelpAfterError()
    .exitOverride();

  const runCommand = withExecutionOptions(
    withWorkspaceOptions(
      new Command('run')
        .description('Execute a REST, GraphQL, or SSE entity')
        .argument('<entity>', 'Entity name or ID'),
    ),
  );
  runCommand.action(async (target: string, options: ExecutionOptions) => {
    state.exitCode = await guarded(options, () => executeCommand(target, 'run', options));
  });

  const testCommand = withExecutionOptions(
    withWorkspaceOptions(
      new Command('test')
        .description('Execute tests for one entity, or every REST, GraphQL, and SSE entity')
        .argument('[entity]', 'Entity name or ID'),
    ),
  );
  testCommand.action(async (target: string | undefined, options: ExecutionOptions) => {
    state.exitCode = await guarded(options, () => executeCommand(target, 'test', options));
  });

  const validateCommand = withWorkspaceOptions(
    new Command('validate').description('Validate every .ysl workspace file'),
  );
  validateCommand.action(async (options: WorkspaceOptions) => {
    state.exitCode = await guarded(options, () => validateCommandAction(options));
  });

  const listCommand = withWorkspaceOptions(new Command('list').description('List REST, GraphQL, and SSE entities'));
  listCommand.addOption(new Option('--kind <kind>', 'Filter by entity kind').choices(['rest', 'graphql', 'sse']));
  listCommand.action(async (options: WorkspaceOptions & { kind?: 'rest' | 'graphql' | 'sse' }) => {
    state.exitCode = await guarded(options, () => listCommandAction(options));
  });

  const infoCommand = withWorkspaceOptions(new Command('info').description('Display workspace information'));
  infoCommand.action(async (options: WorkspaceOptions) => {
    state.exitCode = await guarded(options, () => infoCommandAction(options));
  });

  const restCommand = new Command('rest').description('Backward-compatible REST command aliases');
  const restListCommand = withWorkspaceOptions(new Command('list').description('List REST entities'));
  restListCommand.action(async (options: WorkspaceOptions) => {
    state.exitCode = await guarded(options, () => listCommandAction({ ...options, kind: 'rest' }));
  });

  const restRunCommand = withExecutionOptions(
    withWorkspaceOptions(
      new Command('run')
        .description('Execute REST entities')
        .argument('[entity]', 'REST entity name or ID')
        .option('-a, --all', 'Execute every REST entity')
        .option('--no-script', 'Unsupported compatibility option'),
    ),
  );
  restRunCommand.action(async (target: string | undefined, options: LegacyRestOptions) => {
    state.exitCode = await guarded(options, async () => {
      if (options.script === false) {
        throw new CliInputError('--no-script is not supported by the shared headless lifecycle');
      }
      if (!options.all && !target) throw new CliInputError('Specify an entity or use --all');
      return executeCommand(options.all ? undefined : target, 'run', options, 'rest', options.all === true);
    });
  });
  restCommand.addCommand(restListCommand).addCommand(restRunCommand);

  const sseCommand = new Command('sse').description('SSE entity commands');
  const sseListCommand = withWorkspaceOptions(new Command('list').description('List SSE entities'));
  sseListCommand.action(async (options: WorkspaceOptions) => {
    state.exitCode = await guarded(options, () => listCommandAction({ ...options, kind: 'sse' }));
  });
  const sseRunCommand = withExecutionOptions(
    withWorkspaceOptions(
      new Command('run').description('Connect to an SSE entity').argument('<entity>', 'SSE entity name or ID'),
    ),
  );
  sseRunCommand.action(async (target: string, options: ExecutionOptions) => {
    state.exitCode = await guarded(options, () => executeCommand(target, 'run', options, 'sse'));
  });
  sseCommand.addCommand(sseListCommand).addCommand(sseRunCommand);

  program
    .addCommand(runCommand)
    .addCommand(testCommand)
    .addCommand(validateCommand)
    .addCommand(listCommand)
    .addCommand(infoCommand)
    .addCommand(restCommand)
    .addCommand(sseCommand);
  return program;
}

export async function runCli(argv: string[] = process.argv): Promise<number> {
  const state: ProgramState = { exitCode: CliExitCodes.Success };
  try {
    await createProgram(state).parseAsync(argv);
    return state.exitCode;
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.code === 'commander.helpDisplayed' || error.code === 'commander.version') {
        return CliExitCodes.Success;
      }
      return CliExitCodes.InvalidInput;
    }
    printCommandError(error, argv.includes('--json'));
    return CliExitCodes.ExecutionFailed;
  }
}

async function validateCommandAction(options: WorkspaceOptions): Promise<number> {
  const root = workspaceRoot(options);
  const result = await loadWorkspace(root);
  printValidation(root, result, options.json === true);
  return result.workspace ? CliExitCodes.Success : CliExitCodes.InvalidInput;
}

async function listCommandAction(options: WorkspaceOptions & { kind?: 'rest' | 'graphql' | 'sse' }): Promise<number> {
  const root = workspaceRoot(options);
  const result = await loadWorkspace(root);
  if (!result.workspace) {
    printValidation(root, result, options.json === true);
    return CliExitCodes.InvalidInput;
  }
  printList(result.workspace, sortedEntities(result.workspace, options.kind), options.json === true);
  return CliExitCodes.Success;
}

async function infoCommandAction(options: WorkspaceOptions): Promise<number> {
  const root = workspaceRoot(options);
  const result = await loadWorkspace(root);
  if (!result.workspace) {
    printValidation(root, result, options.json === true);
    return CliExitCodes.InvalidInput;
  }
  printInfo(result.workspace, options.json === true);
  return CliExitCodes.Success;
}

async function executeCommand(
  target: string | undefined,
  mode: 'run' | 'test',
  options: ExecutionOptions,
  kind?: 'rest' | 'graphql' | 'sse',
  all = target === undefined,
): Promise<number> {
  const root = workspaceRoot(options);
  const result = await loadWorkspace(root);
  if (!result.workspace) {
    printValidation(root, result, options.json === true);
    return CliExitCodes.InvalidInput;
  }

  const workspace = result.workspace;
  const selected = all ? sortedEntities(workspace, kind) : target ? [selectEntity(workspace, target, kind)] : [];
  if (selected.length === 0) throw new CliInputError(`No ${kind ? `${kind.toUpperCase()} ` : ''}entities found`);

  const environment = selectEnvironment(workspace, options.environment ?? options.env);
  const dotenv = options.dotenv ? await loadDotenvFile(options.dotenv) : undefined;
  const effectiveEnvironment = resolveCliEnvironment({
    workspace,
    environment,
    dotenv,
    processEnvironment: process.env,
    variables: parseAssignments(options.variable ?? [], false),
    secrets: parseAssignments(options.secret ?? [], true),
  });
  const variables = effectiveEnvironment.variables;
  const secrets = effectiveEnvironment.secrets;
  const timeoutMs = parseTimeout(options.timeout);
  const maxEvents = parsePositiveInteger(options.maxEvents, 'Max events');
  const controller = new AbortController();
  let interrupted = false;
  const onInterrupt = () => {
    interrupted = true;
    controller.abort(new DOMException('Cancelled by SIGINT', 'AbortError'));
  };
  process.once('SIGINT', onInterrupt);

  try {
    const results = await executeBatch({
      workspace,
      entities: selected,
      mode,
      environmentId: environment?.id,
      variables,
      secrets,
      timeoutMs,
      maxEvents,
      signal: controller.signal,
      processEnvironment: process.env,
    });
    printExecution(workspace, mode, selected, results, options.json === true, options.verbose === true);

    if (interrupted || results.some((execution) => execution.status === 'cancelled')) {
      return CliExitCodes.Cancelled;
    }
    return results.some((execution) => executionFailed(execution, mode))
      ? CliExitCodes.ExecutionFailed
      : CliExitCodes.Success;
  } finally {
    process.removeListener('SIGINT', onInterrupt);
  }
}

async function guarded(options: WorkspaceOptions, action: () => Promise<number>): Promise<number> {
  try {
    return await action();
  } catch (error) {
    printCommandError(error, options.json === true, error instanceof CliInputError ? 'INVALID_ARGUMENT' : 'CLI_ERROR');
    return error instanceof CliInputError ? CliExitCodes.InvalidInput : CliExitCodes.ExecutionFailed;
  }
}

function withWorkspaceOptions(command: Command): Command {
  return command
    .option('-w, --workspace <path>', 'Project directory or yasumu workspace directory')
    .option('-p, --path <path>', 'Deprecated alias for --workspace')
    .option('--json', 'Write one machine-readable JSON document');
}

function withExecutionOptions(command: Command): Command {
  return command
    .option('-e, --environment <environment>', 'Environment name or ID')
    .option('--env <environment>', 'Deprecated alias for --environment')
    .option('--dotenv <path>', 'Load values from an explicit dotenv file')
    .addOption(repeatableOption('--variable <key=value>', 'Override an execution variable'))
    .addOption(repeatableOption('--secret <key=value>', 'Provide an execution secret'))
    .option('--timeout <milliseconds>', 'Execution and script timeout in milliseconds')
    .option('--max-events <count>', 'Stop an SSE execution after this many accepted events (default: 10)')
    .option('-v, --verbose', 'Print request and response bodies');
}

function repeatableOption(flags: string, description: string): Option {
  return new Option(flags, description)
    .argParser((value: string, previous: string[] = []) => [...previous, value])
    .default([]);
}

function parseAssignments(values: string[], secrets: true): Record<string, string>;
function parseAssignments(values: string[], secrets: false): Record<string, ReturnType<typeof parseVariableValue>>;
function parseAssignments(
  values: string[],
  secrets: boolean,
): Record<string, string | ReturnType<typeof parseVariableValue>> {
  const output: Record<string, string | ReturnType<typeof parseVariableValue>> = {};
  for (const assignment of values) {
    const separator = assignment.indexOf('=');
    if (separator <= 0) throw new CliInputError(`Expected KEY=VALUE, received: ${assignment}`);
    const key = assignment.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(key)) throw new CliInputError(`Invalid variable name: ${key}`);
    const value = assignment.slice(separator + 1);
    output[key] = secrets ? value : parseVariableValue(value);
  }
  return output;
}

function parseTimeout(value: string | undefined): number | undefined {
  return parsePositiveInteger(value, 'Timeout');
}

function parsePositiveInteger(value: string | undefined, label: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new CliInputError(`${label} must be a positive integer, received: ${value}`);
  }
  return parsed;
}

function workspaceRoot(options: WorkspaceOptions): string {
  return resolveWorkspaceRoot(options.workspace ?? options.path);
}
