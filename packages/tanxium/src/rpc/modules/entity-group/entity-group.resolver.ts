import { Resolver, Mutation } from '@yasumu/den';
import { EntityGroupService } from './entity-group.service.ts';
import { WorkspaceId } from '../common/decorators.ts';
import type { EntityGroupCreateOptions } from './types.ts';
import { NotImplementedException } from '../common/exceptions/http.exception.ts';
import { YasumuRpcService } from '@yasumu/rpc';
import { EntityGroupData } from '@yasumu/common';

@Resolver('entityGroups')
export class EntityGroupResolver implements YasumuRpcService<'entityGroups'> {
  public constructor(private readonly entityGroupService: EntityGroupService) {}

  @Mutation()
  public async create(
    @WorkspaceId() workspaceId: string,
    data: EntityGroupCreateOptions,
  ): Promise<EntityGroupData> {
    return (await this.entityGroupService.create(
      workspaceId,
      data,
    )) as unknown as EntityGroupData;
  }

  @Mutation()
  public delete() {
    throw new NotImplementedException('Not implemented');
  }
}
