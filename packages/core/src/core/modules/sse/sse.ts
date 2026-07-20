import type {
  EntityGroupCreateOptions,
  EntityGroupData,
  EntityGroupUpdateOptions,
  EntityHistoryData,
  SseEntityCreateOptions,
  SseEntityData,
  SseEntityUpdateOptions,
  SseTreeItem,
} from '@yasumu/common';

import type { Workspace } from '../../workspace/workspace.js';
import { SseEntity } from './sse.entity.js';

export class SseModule {
  public constructor(private readonly workspace: Workspace) {}

  public async create(data: SseEntityCreateOptions): Promise<SseEntity> {
    return new SseEntity(this, await this.workspace.manager.yasumu.rpc.sse.create.$mutate({ parameters: [data] }));
  }

  public async get(id: string): Promise<SseEntity> {
    return new SseEntity(this, await this.workspace.manager.yasumu.rpc.sse.get.$query({ parameters: [id] }));
  }

  public delete(id: string): Promise<void> {
    return this.workspace.manager.yasumu.rpc.sse.delete.$mutate({ parameters: [id] });
  }

  public update(id: string, data: Partial<SseEntityUpdateOptions>): Promise<SseEntityData> {
    return this.workspace.manager.yasumu.rpc.sse.update.$mutate({ parameters: [id, data] });
  }

  public async list(): Promise<SseEntity[]> {
    return (await this.workspace.manager.yasumu.rpc.sse.list.$query({ parameters: [] })).map(
      (data) => new SseEntity(this, data),
    );
  }

  public async listTree(): Promise<SseTreeItem[]> {
    return (await this.workspace.manager.yasumu.rpc.sse.listTree.$query({
      parameters: [],
    })) as unknown as SseTreeItem[];
  }

  public createEntityGroup(data: EntityGroupCreateOptions): Promise<EntityGroupData> {
    return this.workspace.manager.yasumu.rpc.entityGroups.create.$mutate({ parameters: [data] });
  }

  public updateEntityGroup(id: string, data: EntityGroupUpdateOptions): Promise<EntityGroupData> {
    return this.workspace.manager.yasumu.rpc.entityGroups.update.$mutate({ parameters: [id, data] });
  }

  public deleteEntityGroup(id: string): Promise<void> {
    return this.workspace.manager.yasumu.rpc.entityGroups.delete.$mutate({ parameters: [id] });
  }

  public listHistory(): Promise<EntityHistoryData[]> {
    return this.workspace.manager.yasumu.rpc.entityHistory.list.$query({ parameters: [{ entityType: 'sse' }] });
  }

  public upsertHistory(entityId: string): Promise<EntityHistoryData> {
    return this.workspace.manager.yasumu.rpc.entityHistory.upsert.$mutate({
      parameters: [{ entityId, entityType: 'sse' }],
    });
  }

  public deleteHistory(entityId: string): Promise<void> {
    return this.workspace.manager.yasumu.rpc.entityHistory.deleteByEntityId.$mutate({ parameters: [entityId] });
  }
}
