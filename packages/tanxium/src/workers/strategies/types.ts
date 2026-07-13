import type { WorkerOutboundMessage } from '../types.ts';

export interface WorkerStrategyCallbacks {
  onMessage: (message: WorkerOutboundMessage<unknown>) => void;
  onError: (error: Error) => void;
  onExit: (code: number) => void;
}

/**
 * The runtime-specific boundary for script workers.
 *
 * ScriptWorker owns the execution protocol; strategies only create, connect,
 * and terminate a worker using a particular runtime API.
 */
export interface ScriptWorkerStrategy {
  readonly id: number | null;

  start(source: string, callbacks: WorkerStrategyCallbacks): void;
  postMessage(message: unknown): void;
  terminate(): void;
}
