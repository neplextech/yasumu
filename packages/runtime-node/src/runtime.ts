import { randomUUID } from 'node:crypto';
import { Worker } from 'node:worker_threads';

import {
  serializeError,
  type CreateRuntimeSessionInput,
  type InvokeHookOptions,
  type RuntimeCapabilities,
  type RuntimeHostCall,
  type RuntimeHostCallHandler,
  type RuntimeHostCallMessage,
  type RuntimeHostCallResult,
  type RuntimeInboundMessage,
  type RuntimeLog,
  type RuntimeOutboundMessage,
  type ScriptHookInvocation,
  type ScriptHookResult,
  type SerializedExecutionError,
  type YasumuRuntimeSession,
  type YasumuScriptRuntime,
} from '@yasumu/runtime-api';

import { NodeRuntimeError } from './runtime-error.js';
import type { NodeWorkerData } from './worker-data.js';

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

export interface NodeScriptRuntimeOptions {
  defaultTimeoutMs?: number;
  startupTimeoutMs?: number;
}

interface PendingInvocation {
  resolve(result: ScriptHookResult): void;
  reject(error: Error): void;
  logs: RuntimeLog[];
  controller: AbortController;
  timeout?: ReturnType<typeof setTimeout>;
  signal?: AbortSignal;
  abortListener?: () => void;
}

export class NodeScriptRuntime implements YasumuScriptRuntime {
  readonly kind = 'node';
  readonly capabilities = NODE_CAPABILITIES;

  readonly #options: Required<NodeScriptRuntimeOptions>;

  constructor(options: NodeScriptRuntimeOptions = {}) {
    this.#options = {
      defaultTimeoutMs: options.defaultTimeoutMs ?? 30_000,
      startupTimeoutMs: options.startupTimeoutMs ?? 10_000,
    };
  }

  async createSession(input: CreateRuntimeSessionInput): Promise<YasumuRuntimeSession> {
    const session = new NodeRuntimeSession(input, this.#options);
    await session.start();
    return session;
  }
}

export function createNodeScriptRuntime(options?: NodeScriptRuntimeOptions): NodeScriptRuntime {
  return new NodeScriptRuntime(options);
}

class NodeRuntimeSession implements YasumuRuntimeSession {
  readonly #input: CreateRuntimeSessionInput;
  readonly #options: Required<NodeScriptRuntimeOptions>;
  readonly #pending = new Map<string, PendingInvocation>();

  #worker?: Worker;
  #starting?: Promise<Worker>;
  #disposed = false;
  #queue: Promise<void> = Promise.resolve();

  constructor(input: CreateRuntimeSessionInput, options: Required<NodeScriptRuntimeOptions>) {
    this.#input = input;
    this.#options = options;
  }

  async start(): Promise<void> {
    await this.#ensureWorker();
  }

  invokeHook(invocation: ScriptHookInvocation, options: InvokeHookOptions = {}): Promise<ScriptHookResult> {
    const operation = this.#queue.then(() => this.#invokeNow(invocation, options));
    this.#queue = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  async dispose(): Promise<void> {
    if (this.#disposed) return;
    this.#disposed = true;

    const error = runtimeError('SCRIPT_SESSION_DISPOSED', 'The Node runtime session was disposed');
    this.#rejectAll(error);

    const worker = this.#worker;
    this.#worker = undefined;
    this.#starting = undefined;
    if (!worker) return;

    worker.postMessage({ type: 'dispose' } satisfies RuntimeInboundMessage);
    await worker.terminate();
  }

  async #invokeNow(invocation: ScriptHookInvocation, options: InvokeHookOptions): Promise<ScriptHookResult> {
    this.#assertActive();
    if (options.signal?.aborted) {
      throw cancellationError(options.signal.reason);
    }

    const worker = await this.#ensureWorker();
    const requestId = randomUUID();
    const timeoutMs = options.timeoutMs ?? this.#options.defaultTimeoutMs;

    return new Promise<ScriptHookResult>((resolve, reject) => {
      const pending: PendingInvocation = {
        resolve,
        reject,
        logs: [],
        controller: new AbortController(),
        signal: options.signal,
      };

      if (options.signal) {
        pending.abortListener = () => {
          this.#hardCancel(requestId, cancellationError(options.signal?.reason));
        };
        options.signal.addEventListener('abort', pending.abortListener, { once: true });
      }

      if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
        pending.timeout = setTimeout(() => {
          this.#hardCancel(
            requestId,
            runtimeError('SCRIPT_TIMEOUT', `Script hook exceeded the ${timeoutMs}ms timeout`),
          );
        }, timeoutMs);
      }

      this.#pending.set(requestId, pending);
      worker.postMessage({
        type: 'invoke',
        requestId,
        invocation,
        timeoutMs,
      } satisfies RuntimeInboundMessage);
    });
  }

  async #ensureWorker(): Promise<Worker> {
    this.#assertActive();
    if (this.#worker) return this.#worker;
    if (this.#starting) return this.#starting;

    this.#starting = new Promise<Worker>((resolve, reject) => {
      const workerData: NodeWorkerData = {
        workspace: this.#input.workspace,
        workspaceModule: this.#input.workspaceModule,
      };
      const worker = new Worker(new URL('./worker.js', import.meta.url), {
        execArgv: process.execArgv.filter((argument) => !argument.startsWith('--input-type')),
        name: `yasumu:${this.#input.workspace.id}`,
        workerData,
      });
      let ready = false;

      const startupTimer = setTimeout(() => {
        reject(runtimeError('SCRIPT_WORKER_START_TIMEOUT', 'The Node runtime worker did not become ready'));
        void worker.terminate();
      }, this.#options.startupTimeoutMs);

      worker.on('message', (message: unknown) => {
        if (!isRuntimeOutboundMessage(message)) return;
        if (message.type === 'ready' && !ready) {
          ready = true;
          clearTimeout(startupTimer);
          this.#worker = worker;
          this.#starting = undefined;
          resolve(worker);
          return;
        }
        void this.#handleMessage(worker, message);
      });

      worker.once('error', (error) => {
        if (!ready) {
          clearTimeout(startupTimer);
          this.#starting = undefined;
          reject(runtimeError('SCRIPT_WORKER_START_ERROR', error.message, error));
        }
      });

      worker.once('exit', (code) => {
        clearTimeout(startupTimer);
        if (this.#worker === worker) this.#worker = undefined;
        if (!ready) {
          this.#starting = undefined;
          reject(runtimeError('SCRIPT_WORKER_EXITED', `Node runtime worker exited with code ${code}`));
          return;
        }
        if (!this.#disposed && code !== 0) {
          this.#rejectAll(runtimeError('SCRIPT_WORKER_EXITED', `Node runtime worker exited with code ${code}`));
        }
      });
    });

    return this.#starting;
  }

  async #handleMessage(worker: Worker, message: RuntimeOutboundMessage): Promise<void> {
    switch (message.type) {
      case 'ready':
        return;
      case 'log': {
        this.#pending.get(message.requestId)?.logs.push(message.log);
        return;
      }
      case 'result': {
        const pending = this.#takePending(message.requestId);
        if (!pending) return;
        pending.resolve({ ...message.result, logs: [...pending.logs, ...message.result.logs] });
        return;
      }
      case 'error': {
        const pending = this.#takePending(message.requestId);
        pending?.reject(new NodeRuntimeError(message.error));
        if (message.error.code === 'SCRIPT_UNHANDLED_ERROR' && this.#worker === worker) {
          this.#worker = undefined;
          void worker.terminate();
        }
        return;
      }
      case 'host-call':
        await this.#handleHostCall(worker, message);
    }
  }

  async #handleHostCall(worker: Worker, message: RuntimeHostCallMessage): Promise<void> {
    const pending = this.#pending.get(message.requestId);
    if (!pending) return;

    let result: RuntimeHostCallResult;
    try {
      result = await dispatchHostCall(message.call, this.#input.hostCall, pending.controller.signal);
    } catch (error) {
      result = {
        id: message.call.id,
        method: message.call.method,
        error: serializeError(error, 'SCRIPT_HOST_CALL_ERROR'),
      };
    }

    if (this.#worker !== worker || !this.#pending.has(message.requestId)) return;
    worker.postMessage({ type: 'host-result', requestId: message.requestId, result } satisfies RuntimeInboundMessage);
  }

  #hardCancel(requestId: string, error: NodeRuntimeError): void {
    const pending = this.#takePending(requestId);
    if (!pending) return;
    pending.controller.abort(error);
    pending.reject(error);

    const worker = this.#worker;
    this.#worker = undefined;
    if (worker) {
      worker.postMessage({ type: 'cancel', requestId, reason: error.message } satisfies RuntimeInboundMessage);
      void worker.terminate();
    }
  }

  #takePending(requestId: string): PendingInvocation | undefined {
    const pending = this.#pending.get(requestId);
    if (!pending) return undefined;
    this.#pending.delete(requestId);
    if (pending.timeout) clearTimeout(pending.timeout);
    if (pending.signal && pending.abortListener) {
      pending.signal.removeEventListener('abort', pending.abortListener);
    }
    return pending;
  }

  #rejectAll(error: NodeRuntimeError): void {
    for (const requestId of [...this.#pending.keys()]) {
      const pending = this.#takePending(requestId);
      if (!pending) continue;
      pending.controller.abort(error);
      pending.reject(error);
    }
  }

  #assertActive(): void {
    if (this.#disposed) {
      throw runtimeError('SCRIPT_SESSION_DISPOSED', 'The Node runtime session was disposed');
    }
  }
}

async function dispatchHostCall(
  call: RuntimeHostCall,
  handler: RuntimeHostCallHandler,
  signal: AbortSignal,
): Promise<RuntimeHostCallResult> {
  switch (call.method) {
    case 'entity.get':
      return { id: call.id, method: call.method, output: await handler(call.method, call.input, signal) };
    case 'entity.list':
      return { id: call.id, method: call.method, output: await handler(call.method, call.input, signal) };
    case 'entity.execute':
      return { id: call.id, method: call.method, output: await handler(call.method, call.input, signal) };
    case 'email.list':
      return { id: call.id, method: call.method, output: await handler(call.method, call.input, signal) };
    case 'email.next':
      return { id: call.id, method: call.method, output: await handler(call.method, call.input, signal) };
    case 'file.resolve':
      return { id: call.id, method: call.method, output: await handler(call.method, call.input, signal) };
    case 'file.open':
      return { id: call.id, method: call.method, output: await handler(call.method, call.input, signal) };
    case 'permission.request':
      return { id: call.id, method: call.method, output: await handler(call.method, call.input, signal) };
  }
}

function runtimeError(code: string, message: string, cause?: Error): NodeRuntimeError {
  const error: SerializedExecutionError = {
    name: 'NodeRuntimeError',
    code,
    message,
    stack: cause?.stack,
  };
  return new NodeRuntimeError(error);
}

function cancellationError(reason: unknown): NodeRuntimeError {
  const message =
    reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'Script execution cancelled';
  return runtimeError('SCRIPT_CANCELLED', message);
}

function isRuntimeOutboundMessage(value: unknown): value is RuntimeOutboundMessage {
  return typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string';
}
