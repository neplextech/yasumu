import { Mutation, Resolver } from '@yasumu/den';
import { ScriptRuntimeService } from './script-runtime.service.ts';
import { WorkspaceId } from '../common/decorators.ts';
import type { ScriptableEntity } from '@yasumu/common';

@Resolver('scriptRuntime')
export class ScriptRuntimeResolver {
  public constructor(
    private readonly scriptRuntimeService: ScriptRuntimeService,
  ) {}

  @Mutation()
  public executeScript(
    @WorkspaceId() workspaceId: string,
    entity: ScriptableEntity,
  ) {
    return this.scriptRuntimeService.executeScript(workspaceId, entity);
  }
}
