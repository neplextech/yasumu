import type { ExternalWorkspaceImportOptions, ExternalWorkspaceExportOptions } from '@yasumu/common';
import { Mutation, Resolver } from '@yasumu/den';
import { YasumuRpcService } from '@yasumu/rpc';

import { WorkspaceId } from '../common/decorators.ts';
import { ExternalWorkspaceService } from './external-workspace.service.ts';

@Resolver('externalWorkspace')
export class ExternalWorkspaceResolver implements YasumuRpcService<'externalWorkspace'> {
  public constructor(private readonly externalWorkspaceService: ExternalWorkspaceService) {}

  @Mutation()
  public import(@WorkspaceId() workspaceId: string, options: ExternalWorkspaceImportOptions) {
    return this.externalWorkspaceService.import(workspaceId, options);
  }

  @Mutation()
  public export(@WorkspaceId() workspaceId: string, options: ExternalWorkspaceExportOptions) {
    return this.externalWorkspaceService.export(workspaceId, options);
  }
}
