import { Resolver, Mutation } from '@yasumu/den';
import { EntityGroupService } from './entity-group.service.ts';
import { WorkspaceId } from '../common/decorators.ts';
import type { EntityGroupCreateOptions } from './types.ts';
import { NotImplementedException } from '../common/exceptions/http.exception.ts';

@Resolver('entityGroups')
export class EntityGroupResolver {
  public constructor(private readonly entityGroupService: EntityGroupService) {}

  @Mutation()
  public create(
    @WorkspaceId() workspaceId: string,
    data: EntityGroupCreateOptions,
  ) {
    return this.entityGroupService.create(workspaceId, data);
  }

  @Mutation()
  public delete() {
    throw new NotImplementedException('Not implemented');
  }
}
