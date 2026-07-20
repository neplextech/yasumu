import type { SseEntityCreateOptions, SseEntityData, SseEntityUpdateOptions } from '@yasumu/common';
import { Mutation, Query, Resolver } from '@yasumu/den';
import type { YasumuRpcService } from '@yasumu/rpc';

import { WorkspaceId } from '../common/decorators.ts';
import { SseService } from './sse.service.ts';

@Resolver('sse')
export class SseResolver implements YasumuRpcService<'sse'> {
  public constructor(private readonly service: SseService) {}

  @Query() public async list(@WorkspaceId() workspaceId: string): Promise<SseEntityData[]> {
    return (await this.service.list(workspaceId)) as unknown as SseEntityData[];
  }
  @Query() public async listTree(@WorkspaceId() workspaceId: string): Promise<SseEntityData[]> {
    return (await this.service.listTree(workspaceId)) as unknown as SseEntityData[];
  }
  @Query() public async get(@WorkspaceId() workspaceId: string, id: string): Promise<SseEntityData> {
    return (await this.service.get(workspaceId, id)) as unknown as SseEntityData;
  }
  @Mutation() public async create(
    @WorkspaceId() workspaceId: string,
    data: SseEntityCreateOptions,
  ): Promise<SseEntityData> {
    return (await this.service.create(workspaceId, data)) as unknown as SseEntityData;
  }
  @Mutation() public async update(
    @WorkspaceId() workspaceId: string,
    id: string,
    data: Partial<SseEntityUpdateOptions>,
  ): Promise<SseEntityData> {
    return (await this.service.update(workspaceId, id, data)) as unknown as SseEntityData;
  }
  @Mutation() public delete(@WorkspaceId() workspaceId: string, id: string) {
    return this.service.delete(workspaceId, id);
  }
}
