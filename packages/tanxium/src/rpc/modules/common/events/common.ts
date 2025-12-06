import { IEvent } from '@yasumu/den';
import { YasumuRpcContext } from '@yasumu/rpc';

export interface YasumuEvent extends IEvent {
  ctx: YasumuRpcContext;
}
