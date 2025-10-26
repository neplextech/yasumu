import { WorkspaceManager } from './core/manager/manager.js';

export interface YasumuOptions {}

export class Yasumu {
  public readonly workspaces = new WorkspaceManager(this);

  public constructor(private readonly options: YasumuOptions) {}
}
