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
  private readonly workerTimestamps = new Map<string, number>();

  private makeBaseKey(workspaceId: string, entityId: string) {
    return `${workspaceId}/${entityId}`;
  }

  private makeModuleKey(baseKey: string, timestamp: number) {
    return `${baseKey}.ts?ts=${timestamp}`;
  }

  public async executeScript<Context, Entity extends ExecutableScript<Context>>(
    workspaceId: string,
    entity: Entity,
    preload: string,
    terminateAfter = true,
  ): Promise<ScriptExecutionResult<Context>> {
    if (entity.script.language !== YasumuScriptingLanguage.JavaScript) {
      throw new Error('Unsupported script language');
    }

    const baseKey = this.makeBaseKey(workspaceId, entity.entityId);
    const isNewWorker = !this.workerManager.has(baseKey);

    if (isNewWorker) {
      this.workerTimestamps.set(baseKey, Date.now());
    }

    const timestamp = this.workerTimestamps.get(baseKey)!;
    const moduleKey = this.makeModuleKey(baseKey, timestamp);

    console.log({ moduleKey, terminateAfter });

    Yasumu.registerVirtualModule(moduleKey, entity.script.code);

    const worker = this.workerManager.getOrCreate<Context>({
      key: baseKey,
      source: preload,
      moduleKey,
      onTerminate: () => {
        console.log(
          `Terminating script worker for ${baseKey}/${worker.moduleKey}/${moduleKey}`,
        );
        Yasumu.unregisterVirtualModule(moduleKey);
        this.workerTimestamps.delete(baseKey);
      },
    });

    try {
      const response = await worker.execute(
        entity.invocationTarget,
        entity.context,
      );

      if (terminateAfter) {
        worker.terminate();
      }

      return {
        context: response.context,
        result: response.success
          ? { success: true, result: response.result }
          : { success: false, error: response.error ?? 'Unknown error' },
      };
    } catch (error) {
      worker.terminate();

      return {
        context: entity.context,
        result: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  public terminateAllWorkers() {
    this.workerManager.terminateAll();
  }
}
