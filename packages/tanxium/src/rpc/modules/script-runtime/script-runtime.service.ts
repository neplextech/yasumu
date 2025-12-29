import { Injectable } from '@yasumu/den';
import {
  ExecutableScript,
  ScriptExecutionResult,
  YasumuScriptingLanguage,
} from '@yasumu/common';
import { ScriptWorkerManager } from '../../../workers/script-worker-manager.ts';

@Injectable()
export class ScriptRuntimeService {
  private readonly workerManager = new ScriptWorkerManager();

  private makeKey(workspaceId: string, entityId: string) {
    return `${workspaceId}/${entityId}.ts`;
  }

  public async executeScript<Context, Entity extends ExecutableScript<Context>>(
    workspaceId: string,
    entity: Entity,
    preload: string,
  ): Promise<ScriptExecutionResult<Context>> {
    if (entity.script.language !== YasumuScriptingLanguage.JavaScript) {
      throw new Error('Unsupported script language');
    }

    const key = this.makeKey(workspaceId, entity.entityId);

    Yasumu.registerVirtualModule(key, entity.script.code);

    const worker = this.workerManager.getOrCreate<Context>({
      key,
      source: preload,
      moduleKey: key,
      onTerminate: () => {
        Yasumu.unregisterVirtualModule(key);
      },
    });

    try {
      const response = await worker.execute(
        entity.invocationTarget,
        entity.context,
      );

      return {
        context: response.context,
        result: response.success
          ? { success: true, result: response.result }
          : { success: false, error: response.error ?? 'Unknown error' },
      };
    } catch (error) {
      return {
        context: entity.context,
        result: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  public terminateWorker(workspaceId: string, entityId: string): boolean {
    const key = this.makeKey(workspaceId, entityId);
    return this.workerManager.terminate(key);
  }

  public terminateAllWorkers() {
    this.workerManager.terminateAll();
  }
}
