import type { Workspace } from '@/core/workspace/workspace.js';
import { RestEntity } from './rest.entity.js';
import type {
  RestEntityCreateOptions,
  RestEntityUpdateOptions,
} from '@yasumu/common';

export class RestModule {
  public constructor(private readonly workspace: Workspace) {}

  public async create(data: RestEntityCreateOptions): Promise<RestEntity> {
    const result = await this.workspace.manager.yasumu.rpc.rest.create.$mutate({
      parameters: [data],
    });

    return new RestEntity(this, result);
  }

  public async get(id: string): Promise<RestEntity> {
    const data = await this.workspace.manager.yasumu.rpc.rest.get.$query({
      parameters: [id],
    });
    return new RestEntity(this, data);
  }

  public async delete(id: string): Promise<void> {
    await this.workspace.manager.yasumu.rpc.rest.delete.$mutate({
      parameters: [id],
    });
  }

  public async update(
    id: string,
    data: Partial<RestEntityUpdateOptions>,
  ): Promise<void> {
    await this.workspace.manager.yasumu.rpc.rest.update.$mutate({
      parameters: [id, data],
    });
  }

  public async list(): Promise<RestEntity[]> {
    const data = await this.workspace.manager.yasumu.rpc.rest.list.$query({
      parameters: [],
    });

    return data.map((data) => new RestEntity(this, data));
  }
}
