import type { Workspace } from './workspace.js';
import type {
  ExternalWorkspaceImportOptions,
  ExternalWorkspaceExportOptions,
} from '@yasumu/common';

export class ExternalWorkspaceProvider {
  public constructor(public readonly workspace: Workspace) {}

  public async importWorkspace(options: ExternalWorkspaceImportOptions) {
    const result =
      await this.workspace.manager.yasumu.rpc.externalWorkspace.import.$mutate({
        parameters: [options],
      });

    return result;
  }

  public async exportWorkspace(options: ExternalWorkspaceExportOptions) {
    const result =
      await this.workspace.manager.yasumu.rpc.externalWorkspace.export.$mutate({
        parameters: [options],
      });
    return result;
  }
}
