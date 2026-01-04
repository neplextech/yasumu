import { Resolver, Mutation, Query } from '@yasumu/den';
import { EntityHistoryService } from './entity-history.service.ts';
import { WorkspaceId } from '../common/decorators.ts';
import type {
  EntityHistoryCreateOptions,
  EntityHistoryListOptions,
} from './types.ts';
import type { YasumuRpcService } from '@yasumu/rpc';
import type { EntityHistoryData } from '@yasumu/common';

@Resolver('entityHistory')
export class EntityHistoryResolver
  implements YasumuRpcService<'entityHistory'>
{
  public constructor(
    private readonly entityHistoryService: EntityHistoryService,
  ) {}

  @Mutation()
  public async upsert(
    @WorkspaceId() workspaceId: string,
    data: EntityHistoryCreateOptions,
  ): Promise<EntityHistoryData> {
    return (await this.entityHistoryService.upsert(
      workspaceId,
      data,
    )) as unknown as EntityHistoryData;
  }

  @Query()
  public async get(
    @WorkspaceId() workspaceId: string,
    id: string,
  ): Promise<EntityHistoryData | null> {
    return (await this.entityHistoryService.get(
      workspaceId,
      id,
    )) as unknown as EntityHistoryData | null;
  }

  @Query()
  public async list(
    @WorkspaceId() workspaceId: string,
    options?: EntityHistoryListOptions,
  ): Promise<EntityHistoryData[]> {
    return (await this.entityHistoryService.list(
      workspaceId,
      options,
    )) as unknown as EntityHistoryData[];
  }

  @Mutation()
  public async delete(
    @WorkspaceId() workspaceId: string,
    id: string,
  ): Promise<void> {
    await this.entityHistoryService.delete(workspaceId, id);
  }

  @Mutation()
  public async deleteByEntityId(
    @WorkspaceId() workspaceId: string,
    entityId: string,
  ): Promise<void> {
    await this.entityHistoryService.deleteByEntityId(workspaceId, entityId);
  }

  @Mutation()
  public async clear(
    @WorkspaceId() workspaceId: string,
    entityType?: string,
  ): Promise<void> {
    await this.entityHistoryService.clear(workspaceId, entityType);
  }
}
