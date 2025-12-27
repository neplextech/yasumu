import { YasumuRpcContext } from '@yasumu/rpc';
import { YasumuEvent } from './common.ts';

export class WorkspaceEvent implements YasumuEvent {
  public constructor(
    public readonly ctx: YasumuRpcContext,
    public readonly workspaceId: string,
    public readonly workspacePath: string,
    public readonly type: 'activated' | 'deactivated',
  ) {}
}
