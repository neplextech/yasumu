import { Worker } from 'node:worker_threads';

import type { ScriptWorkerStrategy, WorkerStrategyCallbacks } from './types.ts';

/** Node.js worker_threads implementation retained for Node-based hosts. */
export class WorkerThreadsStrategy implements ScriptWorkerStrategy {
  private worker: Worker | null = null;

  public get id(): number | null {
    return this.worker?.threadId ?? null;
  }

  public start(source: string, callbacks: WorkerStrategyCallbacks): void {
    this.worker = new Worker(new URL(`data:text/javascript,${encodeURIComponent(source)}`), {
      name: 'yasumu-script-worker',
    });

    this.worker.on('message', callbacks.onMessage);
    this.worker.on('error', callbacks.onError);
    this.worker.on('exit', callbacks.onExit);
  }

  public postMessage(message: unknown): void {
    if (!this.worker) throw new Error('Worker is not available');
    this.worker.postMessage(message);
  }

  public terminate(): void {
    void this.worker?.terminate();
    this.worker = null;
  }
}
