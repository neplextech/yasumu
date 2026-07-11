import type { EnvironmentCreateOptions, EnvironmentData, EnvironmentUpdateOptions } from '@yasumu/common';
import { Resolver, Query, Mutation } from '@yasumu/den';
import { YasumuRpcService } from '@yasumu/rpc';

import { WorkspaceId } from '../common/decorators.ts';
import { EnvironmentsService } from './environment.service.ts';

@Resolver('environments')
export class EnvironmentResolver implements YasumuRpcService<'environments'> {
  public constructor(private readonly environmentsService: EnvironmentsService) {}

  @Query()
  public list(@WorkspaceId() workspaceId: string): Promise<EnvironmentData[]> {
    return this.environmentsService.list(workspaceId);
  }

  @Query()
  public get(@WorkspaceId() workspaceId: string, id: string): Promise<EnvironmentData | null> {
    return this.environmentsService.get(workspaceId, id);
  }

  @Mutation()
  public create(@WorkspaceId() workspaceId: string, data: EnvironmentCreateOptions): Promise<EnvironmentData> {
    return this.environmentsService.create(workspaceId, data);
  }

  @Mutation()
  public update(
    @WorkspaceId() workspaceId: string,
    id: string,
    data: EnvironmentUpdateOptions,
  ): Promise<EnvironmentData> {
    return this.environmentsService.update(workspaceId, id, data);
  }

  @Mutation()
  public delete(@WorkspaceId() workspaceId: string, id: string): Promise<void> {
    return this.environmentsService.delete(workspaceId, id);
  }

  @Mutation()
  public setActive(@WorkspaceId() workspaceId: string, id: string): Promise<void> {
    return this.environmentsService.setActive(workspaceId, id);
  }

  @Query()
  public getActive(@WorkspaceId() workspaceId: string): Promise<EnvironmentData | null> {
    return this.environmentsService.getActive(workspaceId);
  }
}
