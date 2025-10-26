import type { Workspace } from '@/core/workspace/workspace.js';
import { RestEntity } from './rest.entity.js';
import type { RestEntityData } from './types.js';

export class RestModule {
  public constructor(private readonly workspace: Workspace) {}

  public async create(data: RestEntityData): Promise<RestEntity> {
    return new RestEntity(this, data);
  }

  public async open(id: string): Promise<RestEntity> {
    return new RestEntity(this, {} as RestEntityData);
  }

  public async delete(id: string): Promise<void> {}

  public async list(): Promise<RestEntity[]> {
    return [];
  }
}
