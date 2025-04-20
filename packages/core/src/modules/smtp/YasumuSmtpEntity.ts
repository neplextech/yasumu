import { BaseEntity } from '../common/BaseEntity.js';
import {
  type ExecutionOptions,
  type ExecutionResult,
} from '../common/types.js';
import type { YasumuSmtp } from './YasumuSmtp.js';

export class YasumuSmtpEntity extends BaseEntity {
  public constructor(
    public readonly module: YasumuSmtp,
    public data: any,
  ) {
    super();
  }

  public createRootIndexData(): Record<string, any> {
    return {};
  }

  public async execute(options?: ExecutionOptions): Promise<ExecutionResult> {
    return {} as ExecutionResult;
  }
}
