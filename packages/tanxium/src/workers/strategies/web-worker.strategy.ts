import type { WorkerOutboundMessage } from '../types.ts';
import type { ScriptWorkerStrategy, WorkerStrategyCallbacks } from './types.ts';

/** Deno's standards-based Web Worker implementation. */
export class WebWorkerStrategy implements ScriptWorkerStrategy {
  private worker: Worker | null = null;
  private sourceUrl: string | null = null;

  public get id(): number | null {
    // Web Workers intentionally do not expose a thread identifier.
    return null;
  }

  public start(source: string, callbacks: WorkerStrategyCallbacks): void {
    this.sourceUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    this.worker = new Worker(this.sourceUrl, {
      type: 'module',
      name: 'yasumu-script-worker',
    });

    this.worker.addEventListener('message', (event: MessageEvent<WorkerOutboundMessage<unknown>>) => {
      callbacks.onMessage(event.data);
    });
    this.worker.addEventListener('error', (event) => {
      event.preventDefault();
      callbacks.onError(new Error(event.message || 'Worker error'));
    });
    this.worker.addEventListener('messageerror', () => {
      callbacks.onError(new Error('Worker message could not be deserialized'));
    });
  }

  public postMessage(message: unknown): void {
    if (!this.worker) throw new Error('Worker is not available');
    this.worker.postMessage(message);
  }

  public terminate(): void {
    this.worker?.terminate();
    this.worker = null;

    if (this.sourceUrl) {
      URL.revokeObjectURL(this.sourceUrl);
      this.sourceUrl = null;
    }
  }
}
