import { YasumuRpcContext } from '@yasumu/rpc';
import { YasumuEvent } from './common.ts';
import { WorkspaceData } from '@yasumu/common';

export class WorkspaceDiscoveryEvent implements YasumuEvent {
  public constructor(
    public readonly ctx: YasumuRpcContext,
    public readonly workspacePath: string,
    public readonly onComplete: (
      workspace: WorkspaceData | null,
    ) => Promise<void>,
  ) {}
}
