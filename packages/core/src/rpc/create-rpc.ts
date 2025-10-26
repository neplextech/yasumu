import type { PlatformBridge } from './platform-bridge.js';
import type { YasumuRPC } from './rpc-commands.js';
import type { RpcCommandData } from './yasumu-rpc.js';

const actions = ['$mutate', '$query'] as const;

export function createYasumuRPC(platformBridge: PlatformBridge): YasumuRPC {
  const commandSegments: string[] = [];

  const handler: ProxyHandler<YasumuRPC> = {
    get(target, prop, receiver) {
      if (actions.includes(prop as (typeof actions)[number])) {
        return (...args: unknown[]) => {
          const command = commandSegments.join('.');
          return platformBridge.invoke({
            command,
            parameters: args,
          } as RpcCommandData);
        };
      }

      commandSegments.push(prop as string);

      return new Proxy({} as YasumuRPC, handler);
    },
    apply(target, thisArg, argArray) {
      commandSegments.push(...argArray);

      return new Proxy({} as YasumuRPC, handler);
    },
  };

  return new Proxy({} as YasumuRPC, handler);
}
