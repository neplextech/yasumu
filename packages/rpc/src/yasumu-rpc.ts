import type { YasumuRPC } from './rpc-commands.js';

/**
 * A RPC mutation is a command that mutates the state of the system.
 */
export type RpcMutation<Params extends unknown[], ReturnType> = {
  $mutate(options: { parameters: Params }): Promise<Awaited<ReturnType>>;
};

/**
 * A RPC query is a command that queries the state of the system.
 */
export type RpcQuery<Params extends unknown[], ReturnType> = {
  $query(options: { parameters: Params }): Promise<Awaited<ReturnType>>;
};

/**
 * Infer the parameters of a RPC command.
 */
export type InferParameters<
  T extends RpcMutation<unknown[], unknown> | RpcQuery<unknown[], unknown>,
> =
  T extends RpcMutation<infer Params, unknown>
    ? Params
    : T extends RpcQuery<infer Params, unknown>
      ? Params
      : never;

/**
 * Infer the return type of a RPC command.
 */
export type InferReturnType<
  T extends RpcMutation<unknown[], unknown> | RpcQuery<unknown[], unknown>,
> =
  T extends RpcMutation<unknown[], infer ReturnType>
    ? Awaited<ReturnType>
    : T extends RpcQuery<unknown[], infer ReturnType>
      ? Awaited<ReturnType>
      : never;

/**
 * Traverse a deep object to find all RPC commands.
 */
export type TraverseDeep<T> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T]: T[K] extends RpcMutation<unknown[], unknown>
          ? T[K]
          : T[K] extends RpcQuery<unknown[], unknown>
            ? T[K]
            : T[K] extends Record<string, unknown>
              ? TraverseDeep<T[K]>
              : never;
      }
    : never;

/**
 * Extract the RPC types from a deep object.
 */
export type ExtractRpcTypes<T> = T[keyof T] extends never
  ? never
  : T[keyof T] extends
        | RpcMutation<unknown[], unknown>
        | RpcQuery<unknown[], unknown>
    ? T[keyof T]
    : ExtractRpcTypes<T[keyof T]>;

/**
 * A data object for a RPC command.
 */
export interface RpcCommandData<T extends keyof YasumuRPC = keyof YasumuRPC> {
  /**
   * The command to invoke.
   */
  command: T;
  /**
   * The parameters to pass to the command.
   */
  parameters: InferParameters<ExtractRpcTypes<TraverseDeep<YasumuRPC[T]>>>;
}
