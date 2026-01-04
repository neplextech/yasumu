import { Injectable } from '@yasumu/den';
import {
  ExecutableScript,
  ScriptExecutionResult,
  YasumuScriptingLanguage,
} from '@yasumu/common';
import {
  getGlobalScriptWorker,
  terminateGlobalScriptWorker,
} from '../../../workers/script-worker-manager.ts';

@Injectable()
export class ScriptRuntimeService {
  public async executeScript<Context, Entity extends ExecutableScript<Context>>(
    workspaceId: string,
    entity: Entity,
    contextType: string,
  ): Promise<ScriptExecutionResult<Context>> {
    if (entity.script.language !== YasumuScriptingLanguage.JavaScript) {
      throw new Error('Unsupported script language');
    }

    const worker = getGlobalScriptWorker();

    const moduleKey = worker.registerModule(
      `${workspaceId}/${entity.entityId}`,
      entity.script.code,
    );

    try {
      const response = await worker.execute<Context>(
        moduleKey,
        entity.invocationTarget,
        contextType,
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

  public terminateWorker(): void {
    terminateGlobalScriptWorker();
  }
}
