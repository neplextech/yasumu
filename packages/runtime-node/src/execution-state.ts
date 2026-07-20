import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { parentPort } from 'node:worker_threads';

import {
  type Diagnostic,
  type EnvironmentScriptAPI,
  type EnvironmentSnapshot,
  type JsonValue,
  RUNTIME_API_VERSION,
  type RuntimeCapabilities,
  type RuntimeHostCall,
  type RuntimeHostCallResult,
  type RuntimeHostCalls,
  type RuntimeHostMethod,
  type RuntimeInboundMessage,
  type RuntimeLog,
  type RuntimeOutboundMessage,
  type ScriptExecutionInfo,
  type ScriptFileAPI,
  type ScriptHookInvocation,
  type ScriptWorkspace,
  serializeError,
  type TestResult,
  type YasumuFileReference,
} from '@yasumu/runtime-api';

const NODE_CAPABILITIES = Object.freeze({
  workers: true,
  nodeBuiltins: true,
  filesystemRead: true,
  filesystemWrite: true,
  network: true,
  environment: true,
  subprocess: true,
  ffi: true,
  nativeModules: true,
  virtualModules: true,
  workspaceFiles: true,
  email: true,
  nestedExecution: true,
}) satisfies Readonly<RuntimeCapabilities>;

export interface RegisteredTest {
  name: string;
  suite: string[];
  fn(context: TestControl): void | Promise<void>;
}

export interface TestControl {
  skip(): never;
  fail(message?: string): never;
  succeed(): never;
}

export interface TestRunState {
  tests: RegisteredTest[];
  pendingSuites: Promise<void>[];
}

export interface WorkerExecutionState {
  requestId: string;
  invocation: ScriptHookInvocation;
  controller: AbortController;
  cancelReason?: string;
  environment: MutableEnvironment;
  request?: Request;
  requestBackup?: Request;
  response?: Response;
  mockResponse?: Response;
  logs: RuntimeLog[];
  diagnostics: Diagnostic[];
  tests: TestResult[];
  testRun?: TestRunState;
  workspace: ScriptWorkspace;
}

interface PendingHostCall {
  requestId: string;
  resolve(result: RuntimeHostCallResult): void;
  reject(error: Error): void;
  signal?: AbortSignal;
  abortListener?: () => void;
}

if (!parentPort) {
  throw new Error('The Yasumu Node runtime must run inside a worker thread');
}
const port = parentPort;

export const executionStorage = new AsyncLocalStorage<WorkerExecutionState>();
const pendingHostCalls = new Map<string, PendingHostCall>();

export class MutableEnvironment implements EnvironmentScriptAPI {
  readonly id?: string;
  readonly name?: string;
  readonly #variables: Record<string, JsonValue>;
  readonly #secrets: Record<string, string>;

  constructor(snapshot: EnvironmentSnapshot) {
    this.id = snapshot.id;
    this.name = snapshot.name;
    this.#variables = structuredClone(snapshot.variables);
    this.#secrets = structuredClone(snapshot.secrets);
  }

  getVariable(name: string): JsonValue | undefined {
    return this.#variables[name];
  }

  getSecret(name: string): string | undefined {
    return this.#secrets[name];
  }

  getAllVariables(): Readonly<Record<string, JsonValue>> {
    return structuredClone(this.#variables);
  }

  getAllSecrets(): Readonly<Record<string, string>> {
    return structuredClone(this.#secrets);
  }

  setVariable(name: string, value: JsonValue): void {
    this.#variables[name] = structuredClone(value);
  }

  setSecret(name: string, value: string): void {
    this.#secrets[name] = value;
  }

  deleteVariable(name: string): boolean {
    return delete this.#variables[name];
  }

  deleteSecret(name: string): boolean {
    return delete this.#secrets[name];
  }

  hasVariable(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.#variables, name);
  }

  hasSecret(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.#secrets, name);
  }

  snapshot(): EnvironmentSnapshot {
    return {
      id: this.id,
      name: this.name,
      variables: structuredClone(this.#variables),
      secrets: structuredClone(this.#secrets),
    };
  }
}

export function requireExecution(): WorkerExecutionState {
  const state = executionStorage.getStore();
  if (!state) {
    throw workerError('SCRIPT_CONTEXT_UNAVAILABLE', 'The script API is only available during hook execution');
  }
  return state;
}

export function currentExecution(): WorkerExecutionState | undefined {
  return executionStorage.getStore();
}

export function createWorkspaceAPI(invocation: ScriptHookInvocation, environment: MutableEnvironment): ScriptWorkspace {
  const entityAPI = (kind: 'rest' | 'graphql' | 'sse') => ({
    get: (id: string) => callHost('entity.get', { kind, id }),
    list: () => callHost('entity.list', { kind }),
    execute: (id: string, options = {}) => callHost('entity.execute', { kind, id, options }),
  });

  const files: ScriptFileAPI = {
    resolve: (path) => callHost('file.resolve', { path }),
    async open(pathOrReference) {
      const reference =
        typeof pathOrReference === 'string'
          ? await callHost('file.resolve', { path: pathOrReference })
          : pathOrReference;
      const result = await callHost('file.open', { reference });
      return new File([new Uint8Array(result.bytes)], result.file.name, {
        type: result.file.mimeType,
      });
    },
  };

  return {
    ...invocation.workspace,
    rest: entityAPI('rest'),
    graphql: entityAPI('graphql'),
    sse: entityAPI('sse'),
    email: {
      async list(options = {}) {
        const since = normalizeSince(options.since, invocation.execution);
        const result = await callHost('email.list', {
          since,
          limit: options.limit,
        });
        return result.emails;
      },
      async awaitEmail(predicate, options = {}) {
        const state = requireExecution();
        const since = normalizeSince(options.since, invocation.execution);
        const signal = options.signal ?? state.controller.signal;
        const deadline = options.timeoutMs === undefined ? undefined : Date.now() + Math.max(0, options.timeoutMs);
        let cursor: string | undefined;

        while (true) {
          const timeoutMs = deadline === undefined ? undefined : deadline - Date.now();
          if (timeoutMs !== undefined && timeoutMs <= 0) {
            throw workerError('SCRIPT_EMAIL_TIMEOUT', 'No matching email arrived before the timeout');
          }
          const result = await callHost(
            'email.next',
            {
              since,
              cursor,
              timeoutMs,
            },
            signal,
          );
          cursor = result.cursor;
          if (!result.email) {
            throw workerError('SCRIPT_EMAIL_TIMEOUT', 'No matching email arrived before the timeout');
          }
          if (await predicate(result.email)) return result.email;
        }
      },
    },
    env: environment,
    files,
  };
}

export const workspace = contextProxy<ScriptWorkspace>((state) => state.workspace);
export const env = contextProxy<EnvironmentScriptAPI>((state) => state.environment);
export const files = contextProxy<ScriptFileAPI>((state) => state.workspace.files);

export interface NodeRuntimeScriptAPI {
  readonly kind: 'node';
  readonly apiVersion: number;
  readonly capabilities: Readonly<RuntimeCapabilities>;
  readonly execution: ScriptExecutionInfo;
  cancel(reason?: string): void;
  requestPermission(capability: keyof RuntimeCapabilities, resource?: string, reason?: string): Promise<boolean>;
}

export const runtime = contextProxy<NodeRuntimeScriptAPI>((state) => ({
  kind: 'node',
  apiVersion: RUNTIME_API_VERSION,
  capabilities: NODE_CAPABILITIES,
  execution: state.invocation.execution,
  cancel(reason) {
    state.cancelReason = reason ?? 'Cancelled by script';
    state.controller.abort(state.cancelReason);
  },
  async requestPermission(capability, resource, reason) {
    const result = await callHost('permission.request', {
      capability,
      resource,
      reason,
      executionId: state.invocation.execution.id,
    });
    return result.granted;
  },
}));

export function emitLog(level: RuntimeLog['level'], message: string, data?: JsonValue[]): void {
  const state = currentExecution();
  if (!state) return;
  const log: RuntimeLog = { level, message, timestamp: Date.now(), data };
  state.logs.push(log);
  port.postMessage({
    type: 'log',
    requestId: state.requestId,
    log,
  } satisfies RuntimeOutboundMessage);
}

export function resolveHostCall(message: Extract<RuntimeInboundMessage, { type: 'host-result' }>): void {
  const pending = pendingHostCalls.get(message.result.id);
  if (!pending || pending.requestId !== message.requestId) return;
  pendingHostCalls.delete(message.result.id);
  if (pending.signal && pending.abortListener) {
    pending.signal.removeEventListener('abort', pending.abortListener);
  }
  if (message.result.error) {
    pending.reject(workerError(message.result.error.code, message.result.error.message));
  } else {
    pending.resolve(message.result);
  }
}

export function rejectHostCalls(requestId: string, error: Error): void {
  for (const [id, pending] of pendingHostCalls) {
    if (pending.requestId !== requestId) continue;
    pendingHostCalls.delete(id);
    if (pending.signal && pending.abortListener) {
      pending.signal.removeEventListener('abort', pending.abortListener);
    }
    pending.reject(error);
  }
}

export async function callHost<K extends RuntimeHostMethod>(
  method: K,
  input: RuntimeHostCalls[K]['input'],
  signal = requireExecution().controller.signal,
): Promise<RuntimeHostCalls[K]['output']> {
  const state = requireExecution();
  if (signal.aborted) throw abortError(signal.reason);

  const id = randomUUID();
  const result = await new Promise<RuntimeHostCallResult>((resolve, reject) => {
    const pending: PendingHostCall = {
      requestId: state.requestId,
      resolve,
      reject,
      signal,
    };
    pending.abortListener = () => {
      pendingHostCalls.delete(id);
      reject(abortError(signal.reason));
    };
    signal.addEventListener('abort', pending.abortListener, { once: true });
    pendingHostCalls.set(id, pending);

    const call = { id, method, input } as RuntimeHostCall;
    port.postMessage({
      type: 'host-call',
      requestId: state.requestId,
      call,
    } satisfies RuntimeOutboundMessage);
  });

  return result.output as RuntimeHostCalls[K]['output'];
}

export function serializeWorkerError(error: unknown, code = 'SCRIPT_HOOK_ERROR') {
  return serializeError(error, errorCode(error, code));
}

export function workerError(code: string, message: string): Error {
  const error = new Error(message);
  error.name = 'YasumuRuntimeError';
  Object.defineProperty(error, 'code', { value: code, enumerable: true });
  return error;
}

function errorCode(error: unknown, fallback: string): string {
  if (error instanceof Error && 'code' in error && typeof error.code === 'string') return error.code;
  return fallback;
}

function abortError(reason?: unknown): Error {
  const message =
    reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'Execution cancelled';
  return workerError('SCRIPT_CANCELLED', message);
}

function normalizeSince(value: Date | number | undefined, execution: ScriptExecutionInfo): number {
  if (value instanceof Date) return value.getTime();
  return value ?? execution.startedAt;
}

function contextProxy<T extends object>(factory: (state: WorkerExecutionState) => T): T {
  return new Proxy({} as T, {
    get(_target, property) {
      const value = factory(requireExecution())[property as keyof T];
      return typeof value === 'function' ? value.bind(factory(requireExecution())) : value;
    },
    set(_target, property, value) {
      return Reflect.set(factory(requireExecution()), property, value);
    },
    has(_target, property) {
      return property in factory(requireExecution());
    },
    ownKeys() {
      return Reflect.ownKeys(factory(requireExecution()));
    },
    getOwnPropertyDescriptor(_target, property) {
      return (
        Object.getOwnPropertyDescriptor(factory(requireExecution()), property) ?? {
          configurable: true,
          enumerable: true,
          writable: false,
          value: factory(requireExecution())[property as keyof T],
        }
      );
    },
  });
}
