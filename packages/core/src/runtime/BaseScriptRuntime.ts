import type { YasumuWorkspace } from '../YasumuWorkspace.js';

export interface YasumuRuntimeData {}

export abstract class BaseScriptRuntime {
  /**
   * The script runtime of the workspace.
   * @param workspace The workspace that this runtime is running in.
   */
  public constructor(public readonly workspace: YasumuWorkspace) {}

  /**
   * Initializes the script runtime.
   */
  public abstract initialize(data: YasumuRuntimeData): Promise<void>;

  /**
   * Executes the given module with the given code.
   * @param module The module specifier.
   * @param code The code to execute.
   */
  public abstract executeModule(
    module: string,
    code: string,
  ): Promise<YasumuRuntimeData>;
}
