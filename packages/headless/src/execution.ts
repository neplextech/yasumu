import type {
  Diagnostic,
  EnvironmentSnapshot,
  JsonValue,
  NestedExecutionSummary,
  RequestSnapshot,
  ResponseSnapshot,
  RuntimeHostCallHandler,
  RuntimeLog,
  ScriptHookInvocation,
  ScriptSource,
  SerializedExecutionError,
  TestResult,
  YasumuScriptRuntime,
} from '@yasumu/runtime-api';
import { requestFromSnapshot, responseFromSnapshot, snapshotRequest, snapshotResponse } from '@yasumu/runtime-api';

import { resolveEnvironment } from './environment.js';
import { isAbortError, serializeYasumuError, YasumuError, YasumuErrorCodes } from './errors.js';
import type { ExecutionEvent } from './events.js';
import { SecretRedactor } from './interpolation.js';
import type { ExecutableEntity, ExecutionRecord, WorkspaceGroup, YasumuWorkspace } from './model.js';
import {
  noopEventSink,
  systemClock,
  type Clock,
  type EmailProvider,
  type EntityRepository,
  type ExecutionEventSink,
  type ExecutionHistoryRepository,
  type FileResolver,
  type IdGenerator,
  type PermissionProvider,
  type RequestTransport,
  type SecretProvider,
  type WorkspaceRepository,
} from './ports.js';
import { buildEntityRequest } from './requests.js';
import { createWorkspaceRuntimeHost, toScriptEntity } from './runtime-host.js';

export interface ExecuteEntityInput {
  workspaceId: string;
  entityId: string;
  executionId?: string;
  environmentId?: string;
  mode?: 'run' | 'test';
  variables?: Record<string, JsonValue>;
  secrets?: Record<string, string>;
  pathParameters?: Record<string, JsonValue>;
  signal?: AbortSignal;
  options?: ExecutionOptions;
}

export interface ExecutionOptions {
  timeoutMs?: number;
  scriptTimeoutMs?: number;
  includeResponseBody?: boolean;
  maxRequestBodyBytes?: number;
  maxResponseBodyBytes?: number;
  followRedirects?: boolean;
}

export interface ExecutionResult {
  executionId: string;
  rootExecutionId: string;
  parentExecutionId?: string;
  entityId: string;
  entityKind: ExecutableEntity['kind'];
  request?: RequestSnapshot;
  response?: ResponseSnapshot;
  isMockResponse: boolean;
  status: 'completed' | 'cancelled' | 'failed';
  startedAt: number;
  completedAt: number;
  durationMs: number;
  tests: TestResult[];
  logs: RuntimeLog[];
  diagnostics: Diagnostic[];
  nestedExecutions: NestedExecutionSummary[];
  error?: SerializedExecutionError;
}

export interface HeadlessExecutionDependencies {
  workspaces: WorkspaceRepository;
  entities: EntityRepository;
  runtime: YasumuScriptRuntime;
  transport: RequestTransport;
  files?: FileResolver;
  email?: EmailProvider;
  permissions?: PermissionProvider;
  secrets?: SecretProvider;
  events?: ExecutionEventSink;
  history?: ExecutionHistoryRepository;
  clock?: Clock;
  ids?: IdGenerator;
  maxNestingDepth?: number;
}

interface InternalExecutionInput extends ExecuteEntityInput {
  parentExecutionId?: string;
  rootExecutionId?: string;
  depth?: number;
  inheritedEnvironment?: EnvironmentSnapshot;
}

interface ExecutionAccumulator {
  request?: RequestSnapshot;
  response?: ResponseSnapshot;
  runtimeRequest?: RequestSnapshot;
  runtimeResponse?: ResponseSnapshot;
  mocked: boolean;
  environment: EnvironmentSnapshot;
  tests: TestResult[];
  logs: RuntimeLog[];
  diagnostics: Diagnostic[];
  nested: NestedExecutionSummary[];
  secretValues: Set<string>;
  redactor: SecretRedactor;
}

export class HeadlessExecutionService {
  private readonly events: ExecutionEventSink;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  private readonly maxNestingDepth: number;
  private readonly active = new Map<string, AbortController>();

  constructor(private readonly dependencies: HeadlessExecutionDependencies) {
    this.events = dependencies.events ?? noopEventSink;
    this.clock = dependencies.clock ?? systemClock;
    this.ids = dependencies.ids ?? { generate: () => crypto.randomUUID() };
    this.maxNestingDepth = dependencies.maxNestingDepth ?? 8;
  }

  execute(input: ExecuteEntityInput): Promise<ExecutionResult> {
    return this.executeInternal(input);
  }

  cancel(executionId: string, reason = 'Cancelled by user'): boolean {
    const controller = this.active.get(executionId);
    if (!controller) return false;
    controller.abort(new DOMException(reason, 'AbortError'));
    return true;
  }

  get activeExecutionIds(): string[] {
    return [...this.active.keys()];
  }

  private async executeInternal(input: InternalExecutionInput): Promise<ExecutionResult> {
    const executionId = input.executionId ?? this.ids.generate();
    const rootExecutionId = input.rootExecutionId ?? executionId;
    const depth = input.depth ?? 0;
    if (depth > this.maxNestingDepth) {
      throw new YasumuError(
        YasumuErrorCodes.NestingDepthExceeded,
        `Nested execution depth exceeds the configured maximum of ${this.maxNestingDepth}`,
        { executionId, workspaceId: input.workspaceId, entityId: input.entityId },
      );
    }

    const startedAt = this.clock.now();
    const eventClock = this.clock;
    const mode = input.mode ?? 'run';
    const controller = linkedAbortController(input.signal, input.options?.timeoutMs);
    this.active.set(executionId, controller);

    let entityKind: ExecutableEntity['kind'] = 'rest';
    const accumulator: ExecutionAccumulator = {
      mocked: false,
      environment: input.inheritedEnvironment ?? { variables: {}, secrets: {} },
      tests: [],
      logs: [],
      diagnostics: [],
      nested: [],
      secretValues: new Set(),
      redactor: new SecretRedactor([]),
    };
    let redactor = new SecretRedactor([]);

    try {
      const [workspace, entity] = await Promise.all([
        this.dependencies.workspaces.get(input.workspaceId),
        this.dependencies.entities.get(input.workspaceId, input.entityId),
      ]);
      if (!workspace) {
        throw new YasumuError(YasumuErrorCodes.WorkspaceNotFound, `Workspace not found: ${input.workspaceId}`, {
          workspaceId: input.workspaceId,
          entityId: input.entityId,
          executionId,
        });
      }
      if (!entity) {
        throw new YasumuError(YasumuErrorCodes.EntityNotFound, `Entity not found: ${input.entityId}`, {
          workspaceId: input.workspaceId,
          entityId: input.entityId,
          executionId,
        });
      }
      entityKind = entity.kind;
      const selectedEnvironment = input.environmentId
        ? workspace.environments.find((environment) => environment.id === input.environmentId)
        : workspace.environments.find((environment) => environment.id === workspace.activeEnvironmentId);
      if (input.environmentId && !selectedEnvironment) {
        throw new YasumuError(YasumuErrorCodes.InvalidReference, `Environment not found: ${input.environmentId}`, {
          workspaceId: workspace.id,
          entityId: entity.id,
          executionId,
        });
      }
      const providedSecrets = this.dependencies.secrets
        ? await this.dependencies.secrets.resolve(workspace, selectedEnvironment?.id)
        : {};
      const resolvedEnvironment = resolveEnvironment({
        environment: selectedEnvironment,
        providedSecrets,
        executionVariables: {
          ...(input.inheritedEnvironment?.variables ?? {}),
          ...(input.variables ?? {}),
        },
        executionSecrets: {
          ...(input.inheritedEnvironment?.secrets ?? {}),
          ...(input.secrets ?? {}),
        },
      });
      accumulator.environment = resolvedEnvironment.snapshot;
      addSecretValues(accumulator.secretValues, resolvedEnvironment.snapshot.secrets);
      redactor = resolvedEnvironment.redactor;
      accumulator.redactor = redactor;

      await this.emit(baseEvent('execution-started', { mode }));
      throwIfAborted(controller.signal);

      const hookSources = lifecycleSources(workspace, entity);
      const testSources = [...hookSources];
      if (entity.scripts.test && !testSources.some((source) => source.id === entity.scripts.test!.id)) {
        testSources.push(entity.scripts.test);
      }
      const usesRuntime = hookSources.length > 0 || (mode === 'test' && testSources.length > 0);
      const session = usesRuntime
        ? await this.dependencies.runtime.createSession({
            workspace: { id: workspace.id, name: workspace.name, root: workspace.root },
            workspaceModule: workspace.script,
            hostCall: this.createHostCallHandler({
              workspace,
              entity,
              input,
              executionId,
              rootExecutionId,
              depth,
              startedAt,
              controller,
              accumulator,
            }),
          })
        : undefined;

      try {
        const request = await buildEntityRequest(workspace, entity, {
          environment: accumulator.environment,
          variables: input.variables,
          pathParameters: input.pathParameters,
          fileResolver: this.dependencies.files,
          signal: controller.signal,
        });
        if (session) {
          accumulator.runtimeRequest = await snapshotRequest(request.clone(), Number.POSITIVE_INFINITY);
          accumulator.request = await limitRequestSnapshot(
            accumulator.runtimeRequest,
            input.options?.maxRequestBodyBytes,
          );
        } else {
          accumulator.request = await snapshotRequest(request.clone(), input.options?.maxRequestBodyBytes);
        }
        await this.emit(redactor.redactValue(baseEvent('request-prepared', { method: request.method, url: request.url })));

        if (session) {
          for (const source of hookSources) {
            const result = await this.invokeHook(session, source, 'onRequest', workspace, entity, input, {
              executionId,
              rootExecutionId,
              depth,
              startedAt,
              controller,
              accumulator,
            });
            if (result.mockResponse) {
              accumulator.mocked = true;
              break;
            }
          }
        }

        throwIfAborted(controller.signal);
        const transportRequest = accumulator.runtimeRequest
          ? requestFromSnapshot(accumulator.runtimeRequest)
          : request;
        accumulator.request = accumulator.runtimeRequest
          ? await limitRequestSnapshot(accumulator.runtimeRequest, input.options?.maxRequestBodyBytes)
          : await snapshotRequest(transportRequest.clone(), input.options?.maxRequestBodyBytes);
        if (!accumulator.runtimeResponse) {
          await this.emit(baseEvent('request-sent', {}));
          const transportResponse = await this.dependencies.transport.send(
            transportRequest,
            {
              workspace,
              entity,
              executionId,
              timeoutMs: input.options?.timeoutMs,
              followRedirects: input.options?.followRedirects,
            },
            controller.signal,
          );
          if (session) {
            accumulator.runtimeResponse = await snapshotResponse(
              transportResponse,
              Number.POSITIVE_INFINITY,
            );
            accumulator.response = await limitResponseSnapshot(
              accumulator.runtimeResponse,
              responseBodyLimit(input.options),
            );
          } else {
            accumulator.response = await snapshotResponse(transportResponse, responseBodyLimit(input.options));
          }
        }
        if (!accumulator.response) throw new Error('Response snapshot was not created');
        await this.emit(
          baseEvent('response-received', {
            status: accumulator.response.status,
            mocked: accumulator.mocked,
          }),
        );

        if (session) {
          for (const source of hookSources) {
            await this.invokeHook(session, source, 'onResponse', workspace, entity, input, {
              executionId,
              rootExecutionId,
              depth,
              startedAt,
              controller,
              accumulator,
            });
          }

          if (mode === 'test') {
            for (const source of testSources) {
              await this.invokeHook(session, source, 'onTest', workspace, entity, input, {
                executionId,
                rootExecutionId,
                depth,
                startedAt,
                controller,
                accumulator,
              });
            }
          }
        }
      } finally {
        await session?.dispose();
      }

      const completedAt = this.clock.now();
      const result: ExecutionResult = redactResult(
        {
          executionId,
          rootExecutionId,
          parentExecutionId: input.parentExecutionId,
          entityId: input.entityId,
          entityKind,
          request: accumulator.request,
          response: accumulator.response,
          isMockResponse: accumulator.mocked,
          status: 'completed',
          startedAt,
          completedAt,
          durationMs: completedAt - startedAt,
          tests: accumulator.tests,
          logs: accumulator.logs,
          diagnostics: accumulator.diagnostics,
          nestedExecutions: accumulator.nested,
        },
        accumulator.redactor,
      );
      await this.emit(baseEvent('execution-completed', { durationMs: result.durationMs }));
      await this.saveHistory(result, input.workspaceId);
      return result;
    } catch (error) {
      const completedAt = this.clock.now();
      const timedOut = controller.signal.reason instanceof DOMException && controller.signal.reason.name === 'TimeoutError';
      const cancelled = controller.signal.aborted || isAbortError(error);
      const code = timedOut
        ? YasumuErrorCodes.RequestTimeout
        : cancelled
          ? YasumuErrorCodes.ExecutionCancelled
          : YasumuErrorCodes.RequestFailed;
      const serialized = serializeYasumuError(error, code);
      const result: ExecutionResult = redactResult(
        {
          executionId,
          rootExecutionId,
          parentExecutionId: input.parentExecutionId,
          entityId: input.entityId,
          entityKind,
          request: accumulator.request,
          response: accumulator.response,
          isMockResponse: accumulator.mocked,
          status: cancelled ? 'cancelled' : 'failed',
          startedAt,
          completedAt,
          durationMs: completedAt - startedAt,
          tests: accumulator.tests,
          logs: accumulator.logs,
          diagnostics: accumulator.diagnostics,
          nestedExecutions: accumulator.nested,
          error: serialized,
        },
        accumulator.redactor,
      );
      if (cancelled) await this.emit(baseEvent('execution-cancelled', { reason: result.error?.message }));
      else await this.emit(baseEvent('execution-failed', { code: result.error!.code, message: result.error!.message }));
      await this.saveHistory(result, input.workspaceId);
      return result;
    } finally {
      this.active.delete(executionId);
      disposeLinkedAbortController(controller);
    }

    function baseEvent<T extends ExecutionEvent['type']>(
      type: T,
      detail: Omit<Extract<ExecutionEvent, { type: T }>, 'type' | 'executionId' | 'workspaceId' | 'entityId' | 'timestamp' | 'parentExecutionId'>,
    ): Extract<ExecutionEvent, { type: T }> {
      return {
        type,
        executionId,
        workspaceId: input.workspaceId,
        entityId: input.entityId,
        timestamp: eventClock.now(),
        parentExecutionId: input.parentExecutionId,
        ...detail,
      } as Extract<ExecutionEvent, { type: T }>;
    }
  }

  private async invokeHook(
    session: Awaited<ReturnType<YasumuScriptRuntime['createSession']>>,
    source: ScriptSource,
    hook: ScriptHookInvocation['hook'],
    workspace: YasumuWorkspace,
    entity: ExecutableEntity,
    input: InternalExecutionInput,
    context: {
      executionId: string;
      rootExecutionId: string;
      depth: number;
      startedAt: number;
      controller: AbortController;
      accumulator: ExecutionAccumulator;
    },
  ) {
    const { executionId, rootExecutionId, depth, startedAt, controller, accumulator } = context;
    const hookStartedAt = this.clock.now();
    await this.emit({
      type: 'hook-started',
      executionId,
      workspaceId: workspace.id,
      entityId: entity.id,
      timestamp: hookStartedAt,
      parentExecutionId: input.parentExecutionId,
      hook,
      sourceId: source.id,
    });
    const invocation: ScriptHookInvocation = {
      hook,
      source,
      workspace: { id: workspace.id, name: workspace.name, root: workspace.root },
      entity: toScriptEntity(entity),
      execution: {
        id: executionId,
        parentId: input.parentExecutionId,
        rootId: rootExecutionId,
        depth,
        mode: input.mode ?? 'run',
        startedAt,
      },
      environment: accumulator.environment,
      request: accumulator.runtimeRequest,
      response: hook === 'onRequest' ? undefined : accumulator.runtimeResponse,
      isMockResponse: accumulator.mocked,
    };

    let result;
    try {
      result = await session.invokeHook(invocation, {
        signal: controller.signal,
        timeoutMs: input.options?.scriptTimeoutMs ?? input.options?.timeoutMs,
      });
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) throw error;
      throw new YasumuError(YasumuErrorCodes.HookExecutionError, `${hook} failed in ${source.id}`, {
        cause: error,
        workspaceId: workspace.id,
        entityId: entity.id,
        executionId,
      });
    }
    if (result.request && hook === 'onRequest') {
      accumulator.runtimeRequest = result.request;
      accumulator.request = await limitRequestSnapshot(result.request, input.options?.maxRequestBodyBytes);
    }
    if (result.mockResponse && hook === 'onRequest') {
      accumulator.runtimeResponse = result.mockResponse;
      accumulator.response = await limitResponseSnapshot(result.mockResponse, responseBodyLimit(input.options));
    }
    accumulator.environment = result.environment;
    addSecretValues(accumulator.secretValues, result.environment.secrets);
    accumulator.redactor = new SecretRedactor(accumulator.secretValues);
    accumulator.tests.push(...result.tests);
    accumulator.logs.push(...result.logs);
    accumulator.diagnostics.push(...result.diagnostics);
    for (const rawLog of result.logs) {
      const log = accumulator.redactor.redactValue(rawLog);
      await this.emit({
        type: 'runtime-log',
        executionId,
        workspaceId: workspace.id,
        entityId: entity.id,
        timestamp: log.timestamp,
        parentExecutionId: input.parentExecutionId,
        log,
      });
    }
    for (const rawTest of result.tests) {
      const test = accumulator.redactor.redactValue(rawTest);
      await this.emit({
        type: 'test-completed',
        executionId,
        workspaceId: workspace.id,
        entityId: entity.id,
        timestamp: this.clock.now(),
        parentExecutionId: input.parentExecutionId,
        test,
      });
    }
    if (result.cancelled) controller.abort(new DOMException(result.cancelReason ?? 'Cancelled by script', 'AbortError'));
    await this.emit({
      type: 'hook-completed',
      executionId,
      workspaceId: workspace.id,
      entityId: entity.id,
      timestamp: this.clock.now(),
      parentExecutionId: input.parentExecutionId,
      hook,
      sourceId: source.id,
      durationMs: this.clock.now() - hookStartedAt,
    });
    throwIfAborted(controller.signal);
    return result;
  }

  private createHostCallHandler(context: {
    workspace: YasumuWorkspace;
    entity: ExecutableEntity;
    input: InternalExecutionInput;
    executionId: string;
    rootExecutionId: string;
    depth: number;
    startedAt: number;
    controller: AbortController;
    accumulator: ExecutionAccumulator;
  }): RuntimeHostCallHandler {
    const { workspace, input, executionId, rootExecutionId, depth, controller, accumulator } = context;
    return createWorkspaceRuntimeHost(
      {
        entities: this.dependencies.entities,
        email: this.dependencies.email,
        files: this.dependencies.files,
        permissions: this.dependencies.permissions,
        execute: async (request, combined) => {
          const childExecutionId = this.ids.generate();
          await this.emit({
            type: 'nested-execution-started',
            executionId,
            workspaceId: workspace.id,
            entityId: context.entity.id,
            timestamp: this.clock.now(),
            parentExecutionId: input.parentExecutionId,
            childExecutionId,
          });
          const child = await this.executeInternal({
            workspaceId: workspace.id,
            entityId: request.id,
            executionId: childExecutionId,
            parentExecutionId: executionId,
            rootExecutionId,
            depth: depth + 1,
            environmentId: request.options?.environmentId ?? input.environmentId,
            variables: request.options?.variables,
            secrets: request.options?.secrets,
            mode: request.options?.runTests ? 'test' : 'run',
            options: { ...input.options, timeoutMs: request.options?.timeoutMs ?? input.options?.timeoutMs },
            signal: combined,
            inheritedEnvironment: accumulator.environment,
          });
          const summary: NestedExecutionSummary = {
            executionId: child.executionId,
            entityId: child.entityId,
            status: child.status,
            response: request.options?.withResponse ? child.response : undefined,
            tests: child.tests,
            logs: child.logs,
            diagnostics: child.diagnostics,
            error: child.error,
          };
          accumulator.nested.push(summary);
          await this.emit({
            type: 'nested-execution-completed',
            executionId,
            workspaceId: workspace.id,
            entityId: context.entity.id,
            timestamp: this.clock.now(),
            parentExecutionId: input.parentExecutionId,
            childExecutionId,
          });
          return summary;
        },
        onPermissionRequest: (request) =>
          this.emit(
            accumulator.redactor.redactValue({
              type: 'permission-requested',
              executionId,
              workspaceId: workspace.id,
              entityId: context.entity.id,
              timestamp: this.clock.now(),
              parentExecutionId: input.parentExecutionId,
              capability: request.capability,
              resource: request.resource,
            }),
          ),
      },
      {
        workspace,
        executionId,
        entityId: context.entity.id,
        signal: controller.signal,
      },
    );
  }

  private async emit(event: ExecutionEvent): Promise<void> {
    try {
      await this.events.emit(event);
    } catch {
      // Event consumers are observational and never participate in correctness.
    }
  }

  private async saveHistory(result: ExecutionResult, workspaceId: string): Promise<void> {
    if (!this.dependencies.history) return;
    const record: ExecutionRecord = {
      id: result.executionId,
      rootId: result.rootExecutionId,
      parentId: result.parentExecutionId,
      workspaceId,
      entityId: result.entityId,
      entityKind: result.entityKind,
      status: result.status,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      durationMs: result.durationMs,
      tests: result.tests,
      result: JSON.parse(JSON.stringify(result)) as JsonValue,
    };
    await this.dependencies.history.save(record);
  }
}

function lifecycleSources(workspace: YasumuWorkspace, entity: ExecutableEntity): ScriptSource[] {
  const sources: ScriptSource[] = [];
  if (workspace.script) sources.push(workspace.script);
  const groups = groupLineage(workspace.groups, entity.groupId);
  for (const group of groups) if (group.script) sources.push(group.script);
  if (entity.scripts.lifecycle) sources.push(entity.scripts.lifecycle);
  return sources;
}

function groupLineage(groups: WorkspaceGroup[], groupId: string | null): WorkspaceGroup[] {
  if (!groupId) return [];
  const byId = new Map(groups.map((group) => [group.id, group]));
  const lineage: WorkspaceGroup[] = [];
  const seen = new Set<string>();
  let current = byId.get(groupId);
  while (current) {
    if (seen.has(current.id)) throw new YasumuError(YasumuErrorCodes.InvalidReference, `Group cycle detected at ${current.id}`);
    seen.add(current.id);
    lineage.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return lineage;
}

const linkedAbortControllerCleanups = new WeakMap<AbortController, () => void>();

function linkedAbortController(primary?: AbortSignal, timeoutMs?: number, secondary?: AbortSignal): AbortController {
  const controller = new AbortController();
  const disposers: Array<() => void> = [];
  const cleanup = () => {
    for (const dispose of disposers.splice(0)) dispose();
    linkedAbortControllerCleanups.delete(controller);
  };
  linkedAbortControllerCleanups.set(controller, cleanup);
  const abort = (signal: AbortSignal) => controller.abort(signal.reason ?? new DOMException('Aborted', 'AbortError'));
  for (const signal of [primary, secondary]) {
    if (!signal) continue;
    if (signal.aborted) abort(signal);
    else {
      const listener = () => abort(signal);
      signal.addEventListener('abort', listener, { once: true });
      disposers.push(() => signal.removeEventListener('abort', listener));
    }
  }
  if (!controller.signal.aborted && timeoutMs && timeoutMs > 0) {
    const timer = setTimeout(() => controller.abort(new DOMException(`Execution timed out after ${timeoutMs}ms`, 'TimeoutError')), timeoutMs);
    timer.unref?.();
    disposers.push(() => clearTimeout(timer));
  }
  if (controller.signal.aborted) cleanup();
  else controller.signal.addEventListener('abort', cleanup, { once: true });
  return controller;
}

function disposeLinkedAbortController(controller: AbortController): void {
  controller.signal.removeEventListener('abort', linkedAbortControllerCleanups.get(controller) ?? (() => undefined));
  linkedAbortControllerCleanups.get(controller)?.();
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError');
}

function redactResult(result: ExecutionResult, redactor: SecretRedactor): ExecutionResult {
  return redactor.redactValue(result);
}

function addSecretValues(target: Set<string>, secrets: Readonly<Record<string, string>>): void {
  for (const value of Object.values(secrets)) {
    if (value) target.add(value);
  }
}

async function limitRequestSnapshot(snapshot: RequestSnapshot, maxBodyBytes?: number): Promise<RequestSnapshot> {
  return snapshotRequest(requestFromSnapshot(snapshot), maxBodyBytes);
}

async function limitResponseSnapshot(snapshot: ResponseSnapshot, maxBodyBytes?: number): Promise<ResponseSnapshot> {
  return snapshotResponse(responseFromSnapshot(snapshot), maxBodyBytes);
}

function responseBodyLimit(options: ExecutionOptions | undefined): number | undefined {
  return options?.includeResponseBody === false ? 0 : options?.maxResponseBodyBytes;
}
