import { Mutation, Resolver } from '@yasumu/den';
import { YasumuRpcService } from '@yasumu/rpc';

import { WorkspaceId } from '../common/decorators.ts';
import { SynchronizationService } from './synchronization.service.ts';

@Resolver('synchronization')
export class SynchronizationResolver implements YasumuRpcService<'synchronization'> {
  public constructor(private readonly synchronizationService: SynchronizationService) {}

  @Mutation()
  public synchronize(@WorkspaceId() workspaceId: string) {
    return this.synchronizationService.synchronizeWorkspace(workspaceId);
  }
}
