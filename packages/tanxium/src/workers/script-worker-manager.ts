import { ScriptWorker } from './script-worker.ts';
import type { ScriptWorkerStrategy } from './strategies/types.ts';
import { WebWorkerStrategy } from './strategies/web-worker.strategy.ts';
import { WorkerThreadsStrategy } from './strategies/worker-threads.strategy.ts';
import { getGlobalWorkerPreload, type WorkerTransport } from './worker-preload.ts';

let globalWorker: ScriptWorker | null = null;
let workerSource: string | null = null;
let lastWorkerTransport: WorkerTransport | null = null;

function getWorkerSource(transport: WorkerTransport): string {
  if (!workerSource || lastWorkerTransport !== transport) {
    workerSource = getGlobalWorkerPreload(transport);
    lastWorkerTransport = transport;
  }

  return workerSource;
}

function getWorkerStrategy(transport: WorkerTransport): ScriptWorkerStrategy {
  switch (transport) {
    case 'web':
      return new WebWorkerStrategy();
    case 'worker-threads':
      return new WorkerThreadsStrategy();
    default:
      return transport satisfies never;
  }
}

export function getGlobalScriptWorker(strategy: WorkerTransport = 'web'): ScriptWorker {
  if (lastWorkerTransport && lastWorkerTransport !== strategy) {
    terminateGlobalScriptWorker();
  }

  if (!globalWorker || globalWorker.isTerminated()) {
    globalWorker = new ScriptWorker({
      source: getWorkerSource(strategy),
      strategy: getWorkerStrategy(strategy),
      onTerminate: () => {
        globalWorker = null;
      },
    });
    lastWorkerTransport = strategy;
  }

  return globalWorker;
}

export function terminateGlobalScriptWorker(): void {
  if (globalWorker) {
    globalWorker.terminate();
    globalWorker = null;
    lastWorkerTransport = null;
  }
}

export function isGlobalScriptWorkerActive(): boolean {
  return globalWorker !== null && !globalWorker.isTerminated();
}
