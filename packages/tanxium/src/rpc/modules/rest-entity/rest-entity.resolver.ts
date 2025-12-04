import { Mutation, Query, Resolver } from '@yasumu/den';
import { RestEntityService } from './rest-entity.service.ts';
import { WorkspaceId } from '../common/decorators.ts';
import type { RestEntityCreateOptions } from '@yasumu/common';

@Resolver('rest')
export class RestEntityResolver {
  public constructor(private readonly restEntityService: RestEntityService) {}

  @Query()
  public list(@WorkspaceId() workspaceId: string) {
    return this.restEntityService.list(workspaceId);
  }

  @Query()
  public listTree(@WorkspaceId() workspaceId: string) {
    return this.restEntityService.listTree(workspaceId);
  }

  @Query()
  public get(@WorkspaceId() workspaceId: string, id: string) {
    return this.restEntityService.get(workspaceId, id);
  }

  @Mutation()
  public create(
    @WorkspaceId() workspaceId: string,
    data: RestEntityCreateOptions,
  ) {
    return this.restEntityService.create(workspaceId, data);
  }
}
