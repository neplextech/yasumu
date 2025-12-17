import { Mutation, Query, Resolver } from '@yasumu/den';
import { RestService } from './rest.service.ts';
import { WorkspaceId } from '../common/decorators.ts';
import type {
  RestEntityCreateOptions,
  RestEntityUpdateOptions,
} from '@yasumu/common';

@Resolver('rest')
export class RestResolver {
  public constructor(private readonly restService: RestService) {}

  @Query()
  public list(@WorkspaceId() workspaceId: string) {
    return this.restService.list(workspaceId);
  }

  @Query()
  public listTree(@WorkspaceId() workspaceId: string) {
    return this.restService.listTree(workspaceId);
  }

  @Query()
  public get(@WorkspaceId() workspaceId: string, id: string) {
    return this.restService.get(workspaceId, id);
  }

  @Mutation()
  public create(
    @WorkspaceId() workspaceId: string,
    data: RestEntityCreateOptions,
  ) {
    return this.restService.create(workspaceId, data);
  }

  @Mutation()
  public update(
    @WorkspaceId() workspaceId: string,
    id: string,
    data: RestEntityUpdateOptions,
  ) {
    return this.restService.update(workspaceId, id, data);
  }

  @Mutation()
  public delete(@WorkspaceId() workspaceId: string, id: string) {
    return this.restService.delete(workspaceId, id);
  }
}
