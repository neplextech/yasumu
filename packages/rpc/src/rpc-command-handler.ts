import type { PlatformBridge } from './platform-bridge.js';
import type {
  InferParameters,
  InferReturnType,
  RpcMutation,
  RpcQuery,
  RpcQueryOrMutation,
  YasumuRpcCommandMap,
  YasumuRpcContext,
} from './yasumu-rpc.js';

export type YasumuRpcCommandHandler = {
  $query<K extends keyof YasumuRpcCommandMap = keyof YasumuRpcCommandMap>(
    context: YasumuRpcContext,
    command: K,
    data: InferParameters<YasumuRpcCommandMap[K]>,
  ): Promise<InferReturnType<YasumuRpcCommandMap[K]>>;
  $mutation<K extends keyof YasumuRpcCommandMap = keyof YasumuRpcCommandMap>(
    context: YasumuRpcContext,
    command: K,
    data: InferParameters<YasumuRpcCommandMap[K]>,
  ): Promise<InferReturnType<YasumuRpcCommandMap[K]>>;
  handler: PlatformBridge['invoke'];
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
export type RpcCallHandler<P extends unknown[], R> = (
  context: YasumuRpcContext,
  ...args: P
) => Promise<R>;

/**
 * Defines a handler for a Yasumu RPC command.
 * @param handler - The handler to define.
 * @returns The defined handler.
 */
export function defineRpcCommandHandler(
  handler: YasumuRpcCommandHandlerDefinition,
): YasumuRpcCommandHandler {
  const rpcHandler: YasumuRpcCommandHandler = {
    async $query<K extends keyof YasumuRpcCommandMap>(
      context: YasumuRpcContext,
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

      const result = await target.handler(context, ...data);
      return result as InferReturnType<YasumuRpcCommandMap[K]>;
    },
    async $mutation<K extends keyof YasumuRpcCommandMap>(
      context: YasumuRpcContext,
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

      const result = await target.handler(context, ...data);
      return result as InferReturnType<YasumuRpcCommandMap[K]>;
    },
    async handler(context, command) {
      if (command.type === 'mutation') {
        const result = await rpcHandler.$mutation(
          context,
          command.command,
          command.parameters,
        );
        return result;
      } else if (command.type === 'query') {
        const result = await rpcHandler.$query(
          context,
          command.command,
          command.parameters,
        );
        return result;
      } else {
        throw new Error(`Invalid command type: ${command.type}`);
      }
    },
  };

  return rpcHandler;
}
