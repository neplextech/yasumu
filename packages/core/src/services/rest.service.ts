import type { WorkspaceService } from './workspace.service.js';

export class RestService {
  public constructor(private readonly workspace: WorkspaceService) {}

  public async findAll() {}

  public async get(id: string) {}

  public async create() {}

  public async update(id: string) {}

  public async delete(id: string) {}
}
