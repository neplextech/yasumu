import { Mutation, Query, Resolver } from '@yasumu/den';
import type { ExecutionResult } from '@yasumu/headless';
import type { RegisterFileInput, YasumuRpcService } from '@yasumu/rpc';

import { WorkspaceId } from '../common/decorators.ts';
import { ExecutionService, type GuiExecuteEntityInput } from './execution.service.ts';

@Resolver('execution')
export class ExecutionResolver implements YasumuRpcService<'execution'> {
  public constructor(private readonly executionService: ExecutionService) {}

  @Mutation()
  public execute(@WorkspaceId() workspaceId: string, input: GuiExecuteEntityInput): Promise<ExecutionResult> {
    return this.executionService.execute(workspaceId, input);
  }

  @Mutation()
  public async cancel(@WorkspaceId() workspaceId: string, executionId: string, reason?: string): Promise<boolean> {
    return this.executionService.cancel(workspaceId, executionId, reason);
  }

  @Query()
  public async active(@WorkspaceId() workspaceId: string): Promise<string[]> {
    return this.executionService.active(workspaceId);
  }

  @Mutation()
  public async registerFile(@WorkspaceId() workspaceId: string, file: RegisterFileInput) {
    return this.executionService.registerFile(workspaceId, file);
  }
}
