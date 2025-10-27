import type {
  InferParameters,
  InferReturnType,
  RpcMutation,
  RpcQuery,
  RpcQueryOrMutation,
  YasumuRpcCommandMap,
} from './yasumu-rpc.js';

export type YasumuRpcCommandHandler = {
  $query<K extends keyof YasumuRpcCommandMap = keyof YasumuRpcCommandMap>(
    command: K,
    data: InferParameters<YasumuRpcCommandMap[K]>,
  ): Promise<InferReturnType<YasumuRpcCommandMap[K]>>;
  $mutation<K extends keyof YasumuRpcCommandMap = keyof YasumuRpcCommandMap>(
    command: K,
    data: InferParameters<YasumuRpcCommandMap[K]>,
  ): Promise<InferReturnType<YasumuRpcCommandMap[K]>>;
};

/**
 * A handler for a Yasumu RPC command.
 */
export type YasumuRpcCommandHandlerDefinition = {
  [K in keyof YasumuRpcCommandMap]: YasumuRpcCommandMap[K] extends RpcQueryOrMutation<
    infer P,
    infer R
  >
    ? {
        type: YasumuRpcCommandMap[K] extends RpcQuery<P, R>
          ? 'query'
          : YasumuRpcCommandMap[K] extends RpcMutation<P, R>
            ? 'mutation'
            : never;
        handler: RpcCallHandler<P, R>;
      }
    : never;
};

/**
 * A handler for a Yasumu RPC call.
 */
export type RpcCallHandler<P extends unknown[], R> = (...args: P) => Promise<R>;

type RpcCallHandlerWithType<
  T extends 'query' | 'mutation',
  R extends RpcCallHandler<unknown[], unknown> = RpcCallHandler<
    unknown[],
    unknown
  >,
> = {
  type: T;
  handler: R;
};

/**
 * Defines a handler for a Yasumu RPC command.
 * @param handler - The handler to define.
 * @returns The defined handler.
 */
export function defineRpcCommandHandler(
  handler: YasumuRpcCommandHandlerDefinition,
): YasumuRpcCommandHandler {
  return {
    async $query<K extends keyof YasumuRpcCommandMap>(
      command: K,
      data: InferParameters<YasumuRpcCommandMap[K]>,
    ): Promise<InferReturnType<YasumuRpcCommandMap[K]>> {
      const target = handler[command];

      if (!target) {
        throw new Error(`Command ${command} not found`);
      }

      if (target.type !== 'query') {
        throw new RangeError(`Cannot query the command ${command}`);
      }

      const result = await target.handler(data);
      return result as InferReturnType<YasumuRpcCommandMap[K]>;
    },
    async $mutation<K extends keyof YasumuRpcCommandMap>(
      command: K,
      data: InferParameters<YasumuRpcCommandMap[K]>,
    ): Promise<InferReturnType<YasumuRpcCommandMap[K]>> {
      const target = handler[command];

      if (!target) {
        throw new Error(`Command ${command} not found`);
      }

      if (target.type !== 'mutation') {
        throw new RangeError(`Cannot mutate the command ${command}`);
      }

      const result = await target.handler(data);
      return result as InferReturnType<YasumuRpcCommandMap[K]>;
    },
  };
}
