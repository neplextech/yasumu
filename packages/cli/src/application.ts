import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  HeadlessExecutionService,
  HeadlessWorkspaceLoader,
  InMemoryCookieRepository,
  InMemoryEntityRepository,
  InMemoryWorkspaceRepository,
  WorkspaceCookieJar,
  parseDotenv,
  resolveEnvironment,
  type EnvironmentSnapshot,
  type ExecutableEntity,
  type ExecutionResult,
  type WorkspaceEnvironment,
  type WorkspaceLoadResult,
  type YasumuWorkspace,
} from '@yasumu/headless';
import type { JsonValue } from '@yasumu/runtime-api';
import { createNodeScriptRuntime } from '@yasumu/runtime-node';

import { CliFetchTransport } from './echo-transport.js';
import { FileSystemWorkspaceSource, NodeWorkspaceFileResolver } from './filesystem.js';

export class CliInputError extends Error {
  override readonly name = 'CliInputError';
}

export interface ExecutionBatchInput {
  workspace: YasumuWorkspace;
  entities: ExecutableEntity[];
  mode: 'run' | 'test';
  environmentId?: string;
  variables: Record<string, JsonValue>;
  secrets: Record<string, string>;
  timeoutMs?: number;
  maxEvents?: number;
  signal: AbortSignal;
  processEnvironment: NodeJS.ProcessEnv;
}

export interface CliEnvironmentInput {
  workspace: YasumuWorkspace;
  environment?: WorkspaceEnvironment;
  dotenv?: Record<string, string>;
  processEnvironment: NodeJS.ProcessEnv;
  variables: Record<string, JsonValue>;
  secrets: Record<string, string>;
}

export async function loadWorkspace(root: string): Promise<WorkspaceLoadResult> {
  return new HeadlessWorkspaceLoader().load(new FileSystemWorkspaceSource(root));
}

export async function loadDotenvFile(path: string, cwd = process.cwd()): Promise<Record<string, string>> {
  const resolvedPath = resolve(cwd, path);
  try {
    return parseDotenv(await readFile(resolvedPath, 'utf8'));
  } catch {
    throw new CliInputError(`Unable to read dotenv file: ${resolvedPath}`);
  }
}

export function resolveCliEnvironment(input: CliEnvironmentInput): EnvironmentSnapshot {
  const selectedEnvironment =
    input.environment ??
    input.workspace.environments.find((environment) => environment.id === input.workspace.activeEnvironmentId);
  const processVariableOverrides = processVariables(input.processEnvironment);

  return resolveEnvironment({
    environment: selectedEnvironment,
    dotenv: input.dotenv,
    process: input.processEnvironment,
    cliVariables: {
      ...processVariableOverrides,
      ...input.variables,
    },
    cliSecrets: input.secrets,
  }).snapshot;
}

export function sortedEntities(workspace: YasumuWorkspace, kind?: ExecutableEntity['kind']): ExecutableEntity[] {
  return workspace.entities
    .filter((entity) => kind === undefined || entity.kind === kind)
    .sort(
      (left, right) =>
        left.kind.localeCompare(right.kind) || left.name.localeCompare(right.name) || left.id.localeCompare(right.id),
    );
}

export function selectEntity(
  workspace: YasumuWorkspace,
  target: string,
  kind?: ExecutableEntity['kind'],
): ExecutableEntity {
  const entities = sortedEntities(workspace, kind);
  const byId = entities.find((entity) => entity.id === target);
  if (byId) return byId;
  const byName = entities.filter(
    (entity) => entity.name.localeCompare(target, undefined, { sensitivity: 'base' }) === 0,
  );
  if (byName.length === 1) return byName[0]!;
  if (byName.length > 1) {
    throw new CliInputError(
      `Entity name is ambiguous: ${target}. Use one of these IDs: ${byName.map((entity) => entity.id).join(', ')}`,
    );
  }
  throw new CliInputError(`Entity not found: ${target}`);
}

export function selectEnvironment(workspace: YasumuWorkspace, selector?: string): WorkspaceEnvironment | undefined {
  if (!selector) return undefined;
  const byId = workspace.environments.find((environment) => environment.id === selector);
  if (byId) return byId;
  const byName = workspace.environments.filter(
    (environment) => environment.name.localeCompare(selector, undefined, { sensitivity: 'base' }) === 0,
  );
  if (byName.length === 1) return byName[0];
  if (byName.length > 1) {
    throw new CliInputError(
      `Environment name is ambiguous: ${selector}. Use one of these IDs: ${byName.map((environment) => environment.id).join(', ')}`,
    );
  }
  throw new CliInputError(`Environment not found: ${selector}`);
}

export async function executeBatch(input: ExecutionBatchInput): Promise<ExecutionResult[]> {
  const workspaceRepository = new InMemoryWorkspaceRepository([input.workspace]);
  const entityRepository = new InMemoryEntityRepository(workspaceRepository);
  const transport = new CliFetchTransport();
  const cookies = new WorkspaceCookieJar(new InMemoryCookieRepository());
  const service = new HeadlessExecutionService({
    workspaces: workspaceRepository,
    entities: entityRepository,
    runtime: createNodeScriptRuntime({ defaultTimeoutMs: input.timeoutMs }),
    transport,
    cookies,
    files: new NodeWorkspaceFileResolver(),
    secrets: {
      resolve: async (workspace, environmentId) =>
        resolveProcessSecrets(workspace, environmentId, input.processEnvironment),
    },
  });

  try {
    const results: ExecutionResult[] = [];
    for (const entity of input.entities) {
      if (input.signal.aborted) break;
      results.push(
        await service.execute({
          workspaceId: input.workspace.id,
          entityId: entity.id,
          environmentId: input.environmentId,
          mode: input.mode,
          variables: input.variables,
          secrets: input.secrets,
          signal: input.signal,
          options: {
            timeoutMs: input.timeoutMs,
            scriptTimeoutMs: input.timeoutMs,
            includeResponseBody: true,
            maxEvents: input.maxEvents ?? (entity.kind === 'sse' ? 10 : undefined),
          },
        }),
      );
    }
    return results;
  } finally {
    await transport.dispose();
  }
}

export function executionFailed(result: ExecutionResult, mode: 'run' | 'test'): boolean {
  if (result.status !== 'completed') return true;
  if (result.response && (result.response.status < 200 || result.response.status >= 300)) return true;
  return mode === 'test' && result.tests.some((test) => test.result === 'fail');
}

export function processVariables(environment: NodeJS.ProcessEnv): Record<string, JsonValue> {
  const variables: Record<string, JsonValue> = {};
  for (const [key, value] of Object.entries(environment)) {
    if (!key.startsWith('YASUMU_VAR_') || value === undefined) continue;
    variables[key.slice('YASUMU_VAR_'.length)] = parseVariableValue(value);
  }
  return variables;
}

export function parseVariableValue(value: string): JsonValue {
  try {
    return JSON.parse(value) as JsonValue;
  } catch {
    return value;
  }
}

function resolveProcessSecrets(
  workspace: YasumuWorkspace,
  environmentId: string | undefined,
  environment: NodeJS.ProcessEnv,
): Record<string, string> {
  const selected = environmentId
    ? workspace.environments.find((candidate) => candidate.id === environmentId)
    : workspace.environments.find((candidate) => candidate.id === workspace.activeEnvironmentId);
  const secrets: Record<string, string> = {};
  for (const definition of selected?.secrets ?? []) {
    if (!definition.enabled) continue;
    const value = environment[`YASUMU_ENV_${definition.key}`];
    if (value !== undefined) secrets[definition.key] = value;
  }
  return secrets;
}
