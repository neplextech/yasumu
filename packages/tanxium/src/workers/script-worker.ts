import { serializeError } from "../../../runtime-api/src/serialization.ts";
import type {
  InvokeHookOptions,
  RuntimeHostCall,
  RuntimeHostCallHandler,
  RuntimeHostCallResult,
  RuntimeLog,
  ScriptHookInvocation,
  ScriptHookResult,
  SerializedExecutionError,
} from "../../../runtime-api/src/types.ts";

import { computeScriptHash, makeModuleKey } from "./common/script-hash.ts";
import {
  SCRIPT_WORKER_HEARTBEAT_TIMEOUT,
  SCRIPT_WORKER_TERMINATE_WITHOUT_HEARTBEAT_TIMEOUT,
} from "./common/worker-heartbeat.ts";
import type { ScriptWorkerStrategy } from "./strategies/types.ts";
import { WebWorkerStrategy } from "./strategies/web-worker.strategy.ts";
import {
  ScriptExecutionRequest,
  ScriptExecutionResponse,
  WorkerInboundMessage,
  WorkerOutboundMessage,
  WorkerState,
} from "./types.ts";

declare const Yasumu: {
  registerVirtualModule(name: string, code: string): void;
  unregisterVirtualModule(name: string): void;
};

export interface ScriptWorkerOptions {
  source: string;
  onTerminate?: () => void;
  strategy?: ScriptWorkerStrategy;
}

interface RuntimeExecutionRequest {
  resolve(result: ScriptHookResult): void;
  reject(error: Error): void;
  logs: RuntimeLog[];
  hostCall: RuntimeHostCallHandler;
  controller: AbortController;
  timeoutId?: ReturnType<typeof setTimeout>;
  signal?: AbortSignal;
  abortListener?: () => void;
}

export class TanxiumRuntimeError extends Error {
  public readonly code: string;
  public readonly details?: SerializedExecutionError["details"];

  public constructor(error: SerializedExecutionError) {
    super(error.message);
    this.name = error.name || "TanxiumRuntimeError";
    this.code = error.code;
    this.details = error.details;
    if (error.stack) this.stack = error.stack;
    if (error.cause) {
      Object.defineProperty(this, "cause", {
        value: new TanxiumRuntimeError(error.cause),
      });
    }
  }
}

const EXECUTION_TIMEOUT = 30_000;

export class ScriptWorker {
  private strategy: ScriptWorkerStrategy;
  private readonly ownsStrategy: boolean;
  private readonly pendingRequests = new Map<
    string,
    ScriptExecutionRequest<unknown>
  >();
  private readonly pendingRuntimeRequests = new Map<
    string,
    RuntimeExecutionRequest
  >();
  private readonly registeredModules = new Set<string>();
  private state: WorkerState = "terminated";
  private lastHeartbeat = Date.now();
  private heartbeatCheckId: ReturnType<typeof setTimeout> | null = null;
  private readyPromise: Promise<void> | null = null;
  private readyResolve: (() => void) | null = null;
  private readyReject: ((error: Error) => void) | null = null;

  public constructor(private readonly options: ScriptWorkerOptions) {
    this.ownsStrategy = options.strategy === undefined;
    this.strategy = options.strategy ?? new WebWorkerStrategy();
  }

  public get id(): number | null {
    return this.strategy.id;
  }

  public start(): Promise<void> {
    return this.ensureWorker();
  }

  private ensureWorker(): Promise<void> {
    if (this.state !== "terminated") {
      return this.readyPromise!;
    }

    this.state = "initializing";
    this.lastHeartbeat = Date.now();

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    this.readyPromise = promise;
    this.readyResolve = resolve;
    this.readyReject = reject;

    try {
      this.strategy.start(this.options.source, {
        onMessage: this.handleMessage.bind(this),
        onError: this.handleError.bind(this),
        onExit: this.handleExit.bind(this),
      });
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }

    if (this.state !== "terminated") this.startHeartbeatMonitor();

    return promise;
  }

  private handleMessage(message: WorkerOutboundMessage<unknown>) {
    switch (message.type) {
      case "heartbeat":
        this.lastHeartbeat = Date.now();
        break;

      case "ready":
        this.state = "ready";
        this.readyResolve?.();
        break;

      case "execution-success": {
        const request = this.pendingRequests.get(message.requestId);
        if (request) {
          if (request.timeoutId) clearTimeout(request.timeoutId);
          this.pendingRequests.delete(message.requestId);
          this.state = "ready";
          request.resolve({
            context: message.context,
            success: true,
            result: message.result,
          });
        }
        break;
      }

      case "execution-error": {
        const request = this.pendingRequests.get(message.requestId);
        if (request) {
          if (request.timeoutId) clearTimeout(request.timeoutId);
          this.pendingRequests.delete(message.requestId);
          this.state = "ready";
          request.resolve({
            context: message.context,
            success: false,
            error: message.error,
          });
        }
        break;
      }

      case "log": {
        this.pendingRuntimeRequests.get(message.requestId)?.logs.push(
          message.log,
        );
        break;
      }

      case "result": {
        const request = this.takeRuntimeRequest(message.requestId);
        if (request) {
          this.state = "ready";
          request.resolve({
            ...message.result,
            logs: [...request.logs, ...message.result.logs],
          });
        }
        break;
      }

      case "error": {
        const request = this.takeRuntimeRequest(message.requestId);
        if (request) {
          this.state = "ready";
          request.reject(new TanxiumRuntimeError(message.error));
        }
        break;
      }

      case "host-call":
        void this.handleRuntimeHostCall(message.requestId, message.call);
        break;
    }
  }

  private handleError(error: Error) {
    const workerError = runtimeError(
      "SCRIPT_WORKER_ERROR",
      `Worker error: ${error.message}`,
      error,
    );
    if (this.state === "initializing") {
      this.readyReject?.(workerError);
    }

    for (const request of this.pendingRequests.values()) {
      if (request.timeoutId) clearTimeout(request.timeoutId);
      request.reject(new Error(`Worker error: ${error.message}`));
    }
    this.pendingRequests.clear();
    this.rejectRuntimeRequests(workerError);

    if (this.state !== "terminated") {
      this.state = "terminated";
      this.cleanupWorker();
      this.options.onTerminate?.();
    }
  }

  private handleExit(code: number) {
    if (this.state !== "terminated") {
      const workerError = runtimeError(
        "SCRIPT_WORKER_EXITED",
        `Worker exited with code ${code}`,
      );
      if (this.state === "initializing") this.readyReject?.(workerError);
      this.state = "terminated";

      for (const request of this.pendingRequests.values()) {
        if (request.timeoutId) clearTimeout(request.timeoutId);
        request.reject(new Error(`Worker exited with code ${code}`));
      }
      this.pendingRequests.clear();
      this.rejectRuntimeRequests(workerError);

      this.cleanupWorker();
      this.options.onTerminate?.();
    }
  }

  private cleanupWorker() {
    if (this.heartbeatCheckId !== null) {
      clearTimeout(this.heartbeatCheckId);
      this.heartbeatCheckId = null;
    }
    this.strategy.terminate();
    if (this.ownsStrategy) this.strategy = new WebWorkerStrategy();
    this.readyPromise = null;
    this.readyResolve = null;
    this.readyReject = null;
  }

  private startHeartbeatMonitor() {
    const check = () => {
      if (this.state === "terminated") return;

      const elapsed = Date.now() - this.lastHeartbeat;
      if (elapsed >= SCRIPT_WORKER_TERMINATE_WITHOUT_HEARTBEAT_TIMEOUT) {
        this.terminateWithError(
          "Worker heartbeat timeout - worker may be frozen",
        );
        return;
      }

      this.heartbeatCheckId = setTimeout(
        check,
        SCRIPT_WORKER_HEARTBEAT_TIMEOUT,
      );
    };

    this.heartbeatCheckId = setTimeout(check, SCRIPT_WORKER_HEARTBEAT_TIMEOUT);
  }

  private terminateWithError(errorMessage: string) {
    this.resetWorker(
      runtimeError("SCRIPT_WORKER_HEARTBEAT_TIMEOUT", errorMessage),
    );
  }

  public registerModule(entityId: string, code: string): string {
    const hash = computeScriptHash(code);
    const moduleKey = makeModuleKey(entityId, hash);

    Yasumu.registerVirtualModule(moduleKey, code);
    this.registeredModules.add(moduleKey);

    return moduleKey;
  }

  public async publishMessage<T = unknown>(
    event: string,
    data: T,
  ): Promise<void> {
    await this.ensureWorker();
    this.strategy.postMessage({
      type: "publish-message",
      event,
      data,
    });
  }

  public async execute<Context>(
    moduleKey: string,
    invocationTarget: string,
    contextType: string,
    context: Context,
    timeout = EXECUTION_TIMEOUT,
  ): Promise<ScriptExecutionResponse<Context>> {
    await this.ensureWorker();

    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const request = this.pendingRequests.get(requestId);
        if (request) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Execution timeout after ${timeout}ms`));
        }
      }, timeout);

      const request: ScriptExecutionRequest<unknown> = {
        requestId,
        invocationTarget,
        contextType,
        context,
        resolve: resolve as (result: ScriptExecutionResponse<unknown>) => void,
        reject,
        timeoutId: timeoutId as unknown as number,
      };

      this.pendingRequests.set(requestId, request);
      this.state = "executing";

      const message: WorkerInboundMessage<Context> = {
        type: "execute",
        requestId,
        moduleKey,
        invocationTarget,
        contextType,
        context,
      };

      this.strategy.postMessage(message);
    });
  }

  public async invokeRuntimeHook(
    moduleKey: string,
    invocation: ScriptHookInvocation,
    hostCall: RuntimeHostCallHandler,
    options: InvokeHookOptions = {},
  ): Promise<ScriptHookResult> {
    if (options.signal?.aborted) throw cancellationError(options.signal.reason);
    await this.ensureWorker();
    if (options.signal?.aborted) throw cancellationError(options.signal.reason);

    const requestId = crypto.randomUUID();
    const timeout = options.timeoutMs ?? EXECUTION_TIMEOUT;

    return new Promise((resolve, reject) => {
      const request: RuntimeExecutionRequest = {
        resolve,
        reject,
        logs: [],
        hostCall,
        controller: new AbortController(),
        signal: options.signal,
      };

      if (options.signal) {
        request.abortListener = () => {
          this.hardCancelRuntimeRequest(
            requestId,
            cancellationError(options.signal?.reason),
          );
        };
        options.signal.addEventListener("abort", request.abortListener, {
          once: true,
        });
      }

      if (Number.isFinite(timeout) && timeout > 0) {
        request.timeoutId = setTimeout(() => {
          this.hardCancelRuntimeRequest(
            requestId,
            runtimeError(
              "SCRIPT_TIMEOUT",
              `Script hook exceeded the ${timeout}ms timeout`,
            ),
          );
        }, timeout);
      }

      this.pendingRuntimeRequests.set(requestId, request);
      this.state = "executing";
      this.strategy.postMessage(
        {
          type: "invoke",
          requestId,
          moduleKey,
          invocation,
          timeoutMs: timeout,
        } satisfies WorkerInboundMessage,
      );
    });
  }

  private async handleRuntimeHostCall(
    requestId: string,
    call: RuntimeHostCall,
  ): Promise<void> {
    const request = this.pendingRuntimeRequests.get(requestId);
    if (!request) return;

    let result: RuntimeHostCallResult;
    try {
      result = await dispatchHostCall(
        call,
        request.hostCall,
        request.controller.signal,
      );
    } catch (error) {
      result = {
        id: call.id,
        method: call.method,
        error: serializeError(error, "SCRIPT_HOST_CALL_ERROR"),
      };
    }

    if (
      !this.pendingRuntimeRequests.has(requestId) || this.state === "terminated"
    ) return;
    this.strategy.postMessage(
      { type: "host-result", requestId, result } satisfies WorkerInboundMessage,
    );
  }

  private hardCancelRuntimeRequest(
    requestId: string,
    error: TanxiumRuntimeError,
  ): void {
    const request = this.takeRuntimeRequest(requestId);
    if (!request) return;
    request.controller.abort(error);
    request.reject(error);

    try {
      this.strategy.postMessage(
        {
          type: "cancel",
          requestId,
          reason: error.message,
        } satisfies WorkerInboundMessage,
      );
    } catch {
      // A frozen worker can disappear before cancellation is posted.
    }
    this.resetWorker(error);
  }

  private takeRuntimeRequest(
    requestId: string,
  ): RuntimeExecutionRequest | undefined {
    const request = this.pendingRuntimeRequests.get(requestId);
    if (!request) return undefined;
    this.pendingRuntimeRequests.delete(requestId);
    if (request.timeoutId) clearTimeout(request.timeoutId);
    if (request.signal && request.abortListener) {
      request.signal.removeEventListener("abort", request.abortListener);
    }
    return request;
  }

  private rejectRuntimeRequests(error: TanxiumRuntimeError): void {
    for (const requestId of [...this.pendingRuntimeRequests.keys()]) {
      const request = this.takeRuntimeRequest(requestId);
      if (!request) continue;
      request.controller.abort(error);
      request.reject(error);
    }
  }

  private resetWorker(error: Error): void {
    for (const request of this.pendingRequests.values()) {
      if (request.timeoutId) clearTimeout(request.timeoutId);
      request.reject(error);
    }
    this.pendingRequests.clear();
    if (error instanceof TanxiumRuntimeError) this.rejectRuntimeRequests(error);

    if (this.state === "terminated") return;
    this.state = "terminated";
    this.cleanupWorker();
    this.options.onTerminate?.();
  }

  public terminate() {
    this.resetWorker(
      runtimeError(
        "SCRIPT_WORKER_TERMINATED",
        "The script worker was terminated",
      ),
    );
  }

  public dispose(): void {
    if (this.state !== "terminated") {
      try {
        this.strategy.postMessage(
          { type: "dispose" } satisfies WorkerInboundMessage,
        );
      } catch {
        // Disposal still terminates and cleans up modules when the worker is unavailable.
      }
    }
    this.resetWorker(
      runtimeError(
        "SCRIPT_SESSION_DISPOSED",
        "The runtime session was disposed",
      ),
    );
    for (const moduleKey of this.registeredModules) {
      Yasumu.unregisterVirtualModule(moduleKey);
    }
    this.registeredModules.clear();
  }

  public getState(): WorkerState {
    return this.state;
  }

  public isTerminated(): boolean {
    return this.state === "terminated";
  }

  public isReady(): boolean {
    return this.state === "ready" || this.state === "executing";
  }
}

async function dispatchHostCall(
  call: RuntimeHostCall,
  handler: RuntimeHostCallHandler,
  signal: AbortSignal,
): Promise<RuntimeHostCallResult> {
  switch (call.method) {
    case "entity.get":
      return {
        id: call.id,
        method: call.method,
        output: await handler(call.method, call.input, signal),
      };
    case "entity.list":
      return {
        id: call.id,
        method: call.method,
        output: await handler(call.method, call.input, signal),
      };
    case "entity.execute":
      return {
        id: call.id,
        method: call.method,
        output: await handler(call.method, call.input, signal),
      };
    case "email.list":
      return {
        id: call.id,
        method: call.method,
        output: await handler(call.method, call.input, signal),
      };
    case "email.next":
      return {
        id: call.id,
        method: call.method,
        output: await handler(call.method, call.input, signal),
      };
    case "file.resolve":
      return {
        id: call.id,
        method: call.method,
        output: await handler(call.method, call.input, signal),
      };
    case "file.open":
      return {
        id: call.id,
        method: call.method,
        output: await handler(call.method, call.input, signal),
      };
    case "permission.request":
      return {
        id: call.id,
        method: call.method,
        output: await handler(call.method, call.input, signal),
      };
  }
}

function runtimeError(
  code: string,
  message: string,
  cause?: Error,
): TanxiumRuntimeError {
  return new TanxiumRuntimeError({
    name: "TanxiumRuntimeError",
    code,
    message,
    stack: cause?.stack,
  });
}

function cancellationError(reason: unknown): TanxiumRuntimeError {
  const message = reason instanceof Error
    ? reason.message
    : typeof reason === "string"
    ? reason
    : "Script execution cancelled";
  return runtimeError("SCRIPT_CANCELLED", message);
}
