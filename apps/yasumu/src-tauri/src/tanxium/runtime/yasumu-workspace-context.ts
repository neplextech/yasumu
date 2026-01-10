import {
  YasumuWorkspaceEnvironment,
  type EnvironmentData,
} from './yasumu-request.ts';

interface YasumuWorkspaceData {
  id: string;
  name: string;
  path: string | null;
}

export interface YasumuWorkspaceContextData {
  workspace: YasumuWorkspaceData;
  environment: EnvironmentData | null;
}

export interface YasumuScriptContext {
  workspace: YasumuWorkspace;
}

export class YasumuWorkspace {
  public readonly env: YasumuWorkspaceEnvironment;
  public readonly id: string;
  public readonly name: string;
  public readonly path: string | null;
  private readonly context!: YasumuWorkspaceContextData;

  public constructor(context: YasumuWorkspaceContextData) {
    this.env = new YasumuWorkspaceEnvironment(context.environment);
    this.id = context.workspace.id;
    this.name = context.workspace.name;
    this.path = context.workspace.path;

    Object.defineProperty(this, 'context', {
      value: context,
      enumerable: false,
      writable: false,
    });
  }

  public isDefaultWorkspace() {
    return this.path === null;
  }

  public toContext(): YasumuWorkspaceContextData {
    return {
      workspace: this.context.workspace,
      environment: this.env.toData(),
    };
  }
}
