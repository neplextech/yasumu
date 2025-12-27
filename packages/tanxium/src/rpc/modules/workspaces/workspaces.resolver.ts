import { Resolver, Query, Mutation } from '@yasumu/den';
import { WorkspacesService } from './workspaces.service.ts';
import type { WorkspaceCreateOptions, WorkspaceData } from '@yasumu/common';
import { NotFoundException } from '../common/exceptions/http.exception.ts';
import { YasumuRpcService } from '@yasumu/rpc';

@Resolver('workspaces')
export class WorkspacesResolver
  implements YasumuRpcService<'workspaces', true>
{
  public constructor(private readonly workspacesService: WorkspacesService) {}

  @Query()
  public list({ take }: { take?: number }): Promise<WorkspaceData[]> {
    return this.workspacesService.list({ take });
  }

  @Query()
  public async get(id: string): Promise<WorkspaceData> {
    const workspace = await this.workspacesService.findOneById(id);

    if (!workspace) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }

    return workspace;
  }

  @Mutation()
  public create(data: WorkspaceCreateOptions): Promise<WorkspaceData> {
    return this.workspacesService.create(data);
  }

  @Query()
  public active(): Promise<string | null> {
    return this.workspacesService.getActiveWorkspaceId();
  }

  @Mutation()
  public activate(id: string) {
    return this.workspacesService.activate(id);
  }

  @Mutation()
  public deactivate(id: string) {
    return this.workspacesService.deactivate(id);
  }
}
