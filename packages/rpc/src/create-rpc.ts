import type { PlatformBridge } from './platform-bridge.js';
import type { YasumuRPC } from './rpc-commands.js';
import type { RpcCommandData } from './yasumu-rpc.js';

const actions = ['$mutate', '$query'] as const;

/**
 * Creates a new Yasumu RPC proxy.
 * @param platformBridge - The platform bridge to use to make requests to the platform.
 * @returns A new Yasumu RPC proxy.
 */
export function createYasumuRPC(platformBridge: PlatformBridge): YasumuRPC {
  const commandSegments: string[] = [];

  const handler: ProxyHandler<YasumuRPC> = {
    get(target, prop, receiver) {
      if (actions.includes(prop as (typeof actions)[number])) {
        return (...args: unknown[]) => {
          const command = commandSegments.join('.');
          const type = prop === '$mutate' ? 'mutation' : 'query';

          return platformBridge.invoke({
            command,
            parameters: args,
            type,
            isType(t) {
              return t === command;
            },
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
