import type {
  InferReturnType,
  RpcCommandData,
  YasumuRpcCommands,
  YasumuRpcCommandMap,
  YasumuRpcContext,
} from './yasumu-rpc.js';

/**
 * A platform bridge is used to connect Yasumu and the underlying platform.
 */
export interface PlatformBridge {
  /**
   * Makes a request to the platform.
   * @param context - The context of the request.
   * @param command - The command to invoke.
   * @returns The result of the command invocation.
   */
  invoke<
    T extends YasumuRpcCommands = YasumuRpcCommands,
    C extends RpcCommandData<T> = RpcCommandData<T>,
  >(
    context: YasumuRpcContext,
    command: C,
  ): Promise<InferReturnType<YasumuRpcCommandMap[T]>>;
}
