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

export interface ScriptWorkerOptions {
  key: string;
  source: string;
  moduleKey: string;
  onTerminate?: () => void;
}

const EXECUTION_TIMEOUT = 30_000;

export class ScriptWorker<Context = unknown> {
  private readonly worker: Worker;
  private readonly pendingRequests = new Map<
    string,
    ScriptExecutionRequest<Context>
  >();
  private state: WorkerState = 'initializing';
  private lastHeartbeat = Date.now();
  private heartbeatCheckId: ReturnType<typeof setTimeout> | null = null;
  private readyPromise: Promise<void>;
  private readyResolve!: () => void;
  private readyReject!: (error: Error) => void;

  public readonly key: string;
  public readonly moduleKey: string;

  public constructor(private readonly options: ScriptWorkerOptions) {
    this.key = options.key;
    this.moduleKey = options.moduleKey;

    const { promise, resolve, reject } = Promise.withResolvers<void>();

    this.readyPromise = promise;
    this.readyResolve = resolve;
    this.readyReject = reject;

    this.worker = new Worker(options.source, {
      eval: true,
      name: options.key,
    });

    this.worker.on('message', this.handleMessage.bind(this));
    this.worker.on('error', this.handleError.bind(this));
    this.worker.on('exit', this.handleExit.bind(this));

    this.startHeartbeatMonitor();
  }

  public get id(): number {
    return this.worker.threadId;
  }

  private handleMessage(message: WorkerOutboundMessage<Context>) {
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

  private handleError(error: Error) {
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

  private handleExit(code: number) {
    if (this.state !== 'terminated') {
      this.state = 'terminated';

      for (const request of this.pendingRequests.values()) {
        if (request.timeoutId) clearTimeout(request.timeoutId);
        request.reject(new Error(`Worker exited with code ${code}`));
      }
      this.pendingRequests.clear();

      this.options.onTerminate?.();
    }
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
      }, timeout);

      const request: ScriptExecutionRequest<Context> = {
        requestId,
        invocationTarget,
        context,
        resolve,
        reject,
        timeoutId: timeoutId as unknown as number,
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
