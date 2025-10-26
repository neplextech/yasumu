import { WorkspaceManager } from './core/manager/manager.js';
import { createYasumuRPC } from './rpc/create-rpc.js';
import type { PlatformBridge } from './rpc/platform-bridge.js';
import type { YasumuRPC } from './rpc/rpc-commands.js';

export interface YasumuOptions {
  platformBridge: PlatformBridge;
}

export class Yasumu {
  public readonly workspaces = new WorkspaceManager(this);

  public constructor(private readonly options: YasumuOptions) {}

  public get rpc(): YasumuRPC {
    return createYasumuRPC(this.options.platformBridge);
  }
}
