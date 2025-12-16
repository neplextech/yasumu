import { Injectable } from '@yasumu/den';
import type { RpcSubscriptionEvents } from '@yasumu/rpc';

@Injectable()
export class TanxiumService {
  public async publishMessage<E extends keyof RpcSubscriptionEvents>(
    event: E,
    data: RpcSubscriptionEvents[E],
  ) {
    await Yasumu.postMessage({
      type: 'yasumu-subscription',
      data: {
        event,
        data,
      },
    });
  }
}
