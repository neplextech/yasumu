import {
  BaseScriptRuntime,
  type YasumuRuntimeData,
} from './BaseScriptRuntime.js';

export class TanxiumRuntime extends BaseScriptRuntime {
  public async executeModule(
    module: string,
    code: string,
  ): Promise<YasumuRuntimeData> {
    return {};
  }

  public initialize(data: YasumuRuntimeData): Promise<void> {
    return Promise.resolve();
  }
}
