import {
  SCRIPT_WORKER_HEARTBEAT_TIMEOUT,
  SCRIPT_WORKER_TERMINATE_WITHOUT_HEARTBEAT_TIMEOUT,
} from './common/worker-heartbeat.ts';
import type {
  ScriptExecutionRequest,
  ScriptExecutionResponse,
  WorkerInboundMessage,
  WorkerOutboundMessage,
  WorkerState,
} from './types.ts';

const EXECUTION_TIMEOUT = 30_000;

export interface ScriptWorkerOptions {
  key: string;
  source: string;
  moduleKey: string;
  onTerminate?: () => void;
}

export class ScriptWorker<Context = unknown> {
  private readonly worker: Worker;
  private readonly pendingRequests = new Map<
    string,
    ScriptExecutionRequest<Context>
  >();
  private state: WorkerState = 'initializing';
  private lastHeartbeat = Date.now();
  private heartbeatCheckId: number | null = null;
  private readyPromise: Promise<void>;
  private readyResolve!: () => void;
  private readyReject!: (error: Error) => void;

  public readonly key: string;
  public readonly moduleKey: string;

  constructor(private readonly options: ScriptWorkerOptions) {
    this.key = options.key;
    this.moduleKey = options.moduleKey;

    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });

    const url = URL.createObjectURL(
      new Blob([options.source], { type: 'application/typescript' }),
    );

    this.worker = new Worker(url, {
      type: 'module',
      name: options.key,
    });

    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);

    URL.revokeObjectURL(url);
    this.startHeartbeatMonitor();
  }

  private handleMessage(event: MessageEvent<WorkerOutboundMessage<Context>>) {
    const message = event.data;

    switch (message.type) {
      case 'heartbeat':
        this.lastHeartbeat = Date.now();
        break;

      case 'ready':
        this.state = 'ready';
        this.readyResolve();
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

  private handleError(error: ErrorEvent) {
    if (this.state === 'initializing') {
      this.readyReject(
        new Error(`Worker initialization failed: ${error.message}`),
      );
    }

    for (const request of this.pendingRequests.values()) {
      if (request.timeoutId) clearTimeout(request.timeoutId);
      request.reject(new Error(`Worker error: ${error.message}`));
    }
    this.pendingRequests.clear();
  }

  private startHeartbeatMonitor() {
    const check = () => {
      if (this.state === 'terminated') return;

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
      ) as unknown as number;
    };

    this.heartbeatCheckId = setTimeout(
      check,
      SCRIPT_WORKER_HEARTBEAT_TIMEOUT,
    ) as unknown as number;
  }

  private terminateWithError(errorMessage: string) {
    for (const request of this.pendingRequests.values()) {
      if (request.timeoutId) clearTimeout(request.timeoutId);
      request.reject(new Error(errorMessage));
    }
    this.pendingRequests.clear();
    this.terminate();
  }

  public waitForReady(): Promise<void> {
    return this.readyPromise;
  }

  public async execute(
    invocationTarget: string,
    context: Context,
    timeout = EXECUTION_TIMEOUT,
  ): Promise<ScriptExecutionResponse<Context>> {
    if (this.state === 'terminated') {
      throw new Error('Worker has been terminated');
    }

    await this.waitForReady();

    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const request = this.pendingRequests.get(requestId);
        if (request) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Execution timeout after ${timeout}ms`));
        }
      }, timeout) as unknown as number;

      const request: ScriptExecutionRequest<Context> = {
        requestId,
        invocationTarget,
        context,
        resolve,
        reject,
        timeoutId,
      };

      this.pendingRequests.set(requestId, request);
      this.state = 'executing';

      const message: WorkerInboundMessage<Context> = {
        type: 'execute',
        requestId,
        module: `yasumu:virtual/${this.moduleKey}`,
        invocationTarget,
        context,
      };

      this.worker.postMessage(message);
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

    this.worker.terminate();
    this.options.onTerminate?.();
  }

  public getState(): WorkerState {
    return this.state;
  }

  public isTerminated(): boolean {
    return this.state === 'terminated';
  }
}

export class ScriptWorkerManager {
  private readonly workers = new Map<string, ScriptWorker<unknown>>();

  public getOrCreate<Context>(
    options: ScriptWorkerOptions,
  ): ScriptWorker<Context> {
    const existing = this.workers.get(options.key);
    if (existing && !existing.isTerminated()) {
      return existing as ScriptWorker<Context>;
    }

    const worker = new ScriptWorker<Context>({
      ...options,
      onTerminate: () => {
        this.workers.delete(options.key);
        options.onTerminate?.();
      },
    });

    this.workers.set(options.key, worker as ScriptWorker<unknown>);
    return worker;
  }

  public get<Context>(key: string): ScriptWorker<Context> | undefined {
    const worker = this.workers.get(key);
    if (worker?.isTerminated()) {
      this.workers.delete(key);
      return undefined;
    }
    return worker as ScriptWorker<Context> | undefined;
  }

  public terminate(key: string): boolean {
    const worker = this.workers.get(key);
    if (worker) {
      worker.terminate();
      this.workers.delete(key);
      return true;
    }
    return false;
  }

  public terminateAll() {
    for (const worker of this.workers.values()) {
      worker.terminate();
    }
    this.workers.clear();
  }

  public has(key: string): boolean {
    const worker = this.workers.get(key);
    return worker !== undefined && !worker.isTerminated();
  }
}
