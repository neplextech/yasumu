import { YasumuRpcContext } from '@yasumu/rpc';
import { YasumuEvent } from './common.ts';

export class FsSyncEvent implements YasumuEvent {
  public constructor(public readonly ctx: YasumuRpcContext) {}
}
