import type { EntityGroupData, EntityGroupUpdateOptions } from '@yasumu/common';
import { Resolver, Mutation } from '@yasumu/den';
import { YasumuRpcService } from '@yasumu/rpc';

import { WorkspaceId } from '../common/decorators.ts';
import { EntityGroupService } from './entity-group.service.ts';
import type { EntityGroupCreateOptions } from './types.ts';

@Resolver('entityGroups')
export class EntityGroupResolver implements YasumuRpcService<'entityGroups'> {
  public constructor(private readonly entityGroupService: EntityGroupService) {}

  @Mutation()
  public async create(@WorkspaceId() workspaceId: string, data: EntityGroupCreateOptions): Promise<EntityGroupData> {
    return (await this.entityGroupService.create(workspaceId, data)) as unknown as EntityGroupData;
  }

  @Mutation()
  public update(
    @WorkspaceId() workspaceId: string,
    id: string,
    data: EntityGroupUpdateOptions,
  ): Promise<EntityGroupData> {
    return this.entityGroupService.update(workspaceId, id, data);
  }

  @Mutation()
  public delete(@WorkspaceId() workspaceId: string, id: string) {
    return this.entityGroupService.delete(workspaceId, id);
  }
}
