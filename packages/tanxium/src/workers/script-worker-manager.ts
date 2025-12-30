import { ScriptWorker, ScriptWorkerOptions } from './script-worker.ts';

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
