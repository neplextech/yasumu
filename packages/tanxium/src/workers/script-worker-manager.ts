import { ScriptWorker } from './script-worker.ts';
import { getGlobalWorkerPreload } from './worker-preload.ts';

let globalWorker: ScriptWorker | null = null;
let workerSource: string | null = null;

function getWorkerSource(): string {
  if (!workerSource) {
    workerSource = getGlobalWorkerPreload();
  }
  return workerSource;
}

export function getGlobalScriptWorker(): ScriptWorker {
  if (!globalWorker || globalWorker.isTerminated()) {
    globalWorker = new ScriptWorker({
      source: getWorkerSource(),
      onTerminate: () => {
        globalWorker = null;
      },
    });
  }
  return globalWorker;
}

export function terminateGlobalScriptWorker(): void {
  if (globalWorker) {
    globalWorker.terminate();
    globalWorker = null;
  }
}

export function isGlobalScriptWorkerActive(): boolean {
  return globalWorker !== null && !globalWorker.isTerminated();
}
