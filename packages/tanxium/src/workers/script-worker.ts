import { Worker } from 'node:worker_threads';
import {
  ScriptExecutionRequest,
  ScriptExecutionResponse,
  WorkerInboundMessage,
  WorkerOutboundMessage,
  WorkerState,
} from './types.ts';
import {
  SCRIPT_WORKER_HEARTBEAT_TIMEOUT,
  SCRIPT_WORKER_TERMINATE_WITHOUT_HEARTBEAT_TIMEOUT,
} from './common/worker-heartbeat.ts';
import { computeScriptHash, makeModuleKey } from './common/script-hash.ts';

export interface ScriptWorkerOptions {
  source: string;
  onTerminate?: () => void;
}

const EXECUTION_TIMEOUT = 30_000;

export class ScriptWorker {
  private worker: Worker | null = null;
  private readonly pendingRequests = new Map<
    string,
    ScriptExecutionRequest<unknown>
  >();
  private state: WorkerState = 'terminated';
  private lastHeartbeat = Date.now();
  private heartbeatCheckId: ReturnType<typeof setTimeout> | null = null;
  private readyPromise: Promise<void> | null = null;
  private readyResolve: (() => void) | null = null;
  private readyReject: ((error: Error) => void) | null = null;

  public constructor(private readonly options: ScriptWorkerOptions) {}

  public get id(): number | null {
    return this.worker?.threadId ?? null;
  }

  private ensureWorker(): Promise<void> {
    if (this.worker && this.state !== 'terminated') {
      return this.readyPromise!;
    }

    this.state = 'initializing';
    this.lastHeartbeat = Date.now();

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    this.readyPromise = promise;
    this.readyResolve = resolve;
    this.readyReject = reject;

    this.worker = new Worker(this.options.source, {
      eval: true,
      name: 'yasumu-script-worker',
    });

    this.worker.on('message', this.handleMessage.bind(this));
    this.worker.on('error', this.handleError.bind(this));
    this.worker.on('exit', this.handleExit.bind(this));

    this.startHeartbeatMonitor();

    return this.readyPromise;
  }

  private handleMessage(message: WorkerOutboundMessage<unknown>) {
    switch (message.type) {
      case 'heartbeat':
        this.lastHeartbeat = Date.now();
        break;

      case 'ready':
        this.state = 'ready';
        this.readyResolve?.();
        break;

      case 'execution-success': {
        const request = this.pendingRequests.get(message.requestId);
        if (request) {
          if (request.timeoutId) clearTimeout(request.timeoutId);
          this.pendingRequests.delete(message.requestId);
          this.state = 'ready';
          request.resolve({
            context: message.context,
            success: true,
            result: message.result,
          });
        }
        break;
      }

      case 'execution-error': {
        const request = this.pendingRequests.get(message.requestId);
        if (request) {
          if (request.timeoutId) clearTimeout(request.timeoutId);
          this.pendingRequests.delete(message.requestId);
          this.state = 'ready';
          request.resolve({
            context: message.context,
            success: false,
            error: message.error,
          });
        }
        break;
      }
    }
  }

  private handleError(error: Error) {
    if (this.state === 'initializing') {
      this.readyReject?.(
        new Error(`Worker initialization failed: ${error.message}`),
      );
    }

    for (const request of this.pendingRequests.values()) {
      if (request.timeoutId) clearTimeout(request.timeoutId);
      request.reject(new Error(`Worker error: ${error.message}`));
    }
    this.pendingRequests.clear();
  }

  private handleExit(code: number) {
    if (this.state !== 'terminated') {
      this.state = 'terminated';

      for (const request of this.pendingRequests.values()) {
        if (request.timeoutId) clearTimeout(request.timeoutId);
        request.reject(new Error(`Worker exited with code ${code}`));
      }
      this.pendingRequests.clear();

      this.cleanupWorker();
      this.options.onTerminate?.();
    }
  }

  private cleanupWorker() {
    if (this.heartbeatCheckId !== null) {
      clearTimeout(this.heartbeatCheckId);
      this.heartbeatCheckId = null;
    }
    this.worker = null;
    this.readyPromise = null;
    this.readyResolve = null;
    this.readyReject = null;
  }

  private startHeartbeatMonitor() {
    const check = () => {
      if (this.state === 'terminated' || !this.worker) return;

      const elapsed = Date.now() - this.lastHeartbeat;
      if (elapsed >= SCRIPT_WORKER_TERMINATE_WITHOUT_HEARTBEAT_TIMEOUT) {
        this.terminateWithError(
          'Worker heartbeat timeout - worker may be frozen',
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
    for (const request of this.pendingRequests.values()) {
      if (request.timeoutId) clearTimeout(request.timeoutId);
      request.reject(new Error(errorMessage));
    }
    this.pendingRequests.clear();
    this.terminate();
  }

  public registerModule(entityId: string, code: string): string {
    const hash = computeScriptHash(code);
    const moduleKey = makeModuleKey(entityId, hash);

    Yasumu.registerVirtualModule(moduleKey, code);

    return moduleKey;
  }

  public async execute<Context>(
    moduleKey: string,
    invocationTarget: string,
    contextType: string,
    context: Context,
    timeout = EXECUTION_TIMEOUT,
  ): Promise<ScriptExecutionResponse<Context>> {
    await this.ensureWorker();

    if (!this.worker) {
      throw new Error('Worker is not available');
    }

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
      this.state = 'executing';

      const message: WorkerInboundMessage<Context> = {
        type: 'execute',
        requestId,
        moduleKey,
        invocationTarget,
        contextType,
        context,
      };

      this.worker!.postMessage(message);
    });
  }

  public terminate() {
    if (this.state === 'terminated') return;

    this.state = 'terminated';

    if (this.heartbeatCheckId !== null) {
      clearTimeout(this.heartbeatCheckId);
    }

    for (const request of this.pendingRequests.values()) {
      if (request.timeoutId) clearTimeout(request.timeoutId);
    }
    this.pendingRequests.clear();

    if (this.worker) {
      this.worker.terminate();
    }

    this.cleanupWorker();
    this.options.onTerminate?.();
  }

  public getState(): WorkerState {
    return this.state;
  }

  public isTerminated(): boolean {
    return this.state === 'terminated';
  }

  public isReady(): boolean {
    return this.state === 'ready' || this.state === 'executing';
  }
}
