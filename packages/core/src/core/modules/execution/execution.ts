import type { ExecuteEntityInput, ExecutionResult, YasumuFileReference } from '@yasumu/headless';
import type { RegisterFileInput } from '@yasumu/rpc';

import type { Workspace } from '../../workspace/workspace.js';

export type WorkspaceExecutionInput = Omit<ExecuteEntityInput, 'workspaceId' | 'signal'>;

/**
 * Runs REST and GraphQL entities through Yasumu's canonical headless lifecycle.
 */
export class ExecutionModule {
  public constructor(private readonly workspace: Workspace) {}

  public execute(input: WorkspaceExecutionInput): Promise<ExecutionResult> {
    return this.workspace.manager.yasumu.rpc.execution.execute.$mutate({ parameters: [input] });
  }

  public run(
    entityId: string,
    input: Omit<WorkspaceExecutionInput, 'entityId' | 'mode'> = {},
  ): Promise<ExecutionResult> {
    return this.execute({ ...input, entityId, mode: 'run' });
  }

  public test(
    entityId: string,
    input: Omit<WorkspaceExecutionInput, 'entityId' | 'mode'> = {},
  ): Promise<ExecutionResult> {
    return this.execute({ ...input, entityId, mode: 'test' });
  }

  public cancel(executionId: string, reason?: string): Promise<boolean> {
    return this.workspace.manager.yasumu.rpc.execution.cancel.$mutate({ parameters: [executionId, reason] });
  }

  public active(): Promise<string[]> {
    return this.workspace.manager.yasumu.rpc.execution.active.$query({ parameters: [] });
  }

  /** Uploads bytes once and returns the serializable host reference persisted in request bodies. */
  public registerFile(file: RegisterFileInput): Promise<YasumuFileReference> {
    return this.workspace.manager.yasumu.rpc.execution.registerFile.$mutate({ parameters: [file] });
  }
}
