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
 * The type of a RPC call.
 */
export type YasumuRpcCallType = 'mutation' | 'query';

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
export type ExtractRpcTypes<T> =
  T extends RpcMutation<unknown[], unknown>
    ? T
    : T extends RpcQuery<unknown[], unknown>
      ? T
      : T[keyof T] extends never
        ? never
        : T[keyof T] extends
              | RpcMutation<unknown[], unknown>
              | RpcQuery<unknown[], unknown>
          ? T[keyof T]
          : ExtractRpcTypes<T[keyof T]>;

/**
 * A data object for a RPC command.
 */
export interface RpcCommandData<
  T extends YasumuRpcCommands = YasumuRpcCommands,
> {
  /**
   * The command to invoke.
   */
  command: T;
  /**
   * The parameters to pass to the command.
   */
  parameters: InferParameters<ExtractRpcTypes<ResolveRpcCommandValue<T>>>;
  /**
   * The type of the command.
   */
  type: YasumuRpcCallType;
  /**
   * Type assertion for this command
   */
  isType<C extends YasumuRpcCommands>(type: C): this is RpcCommandData<C>;
}

/**
 * Converts path string such as `workspaces.create` into the corresponding value in the YasumuRPC interface.
 */
export type ResolveRpcCommandValue<K extends YasumuRpcCommands> =
  K extends `${infer T}.${infer U}`
    ? YasumuRPC[T & keyof YasumuRPC][U & keyof YasumuRPC[T & keyof YasumuRPC]]
    : never;

type ToCommandPathString<T extends keyof YasumuRPC> = T extends keyof YasumuRPC
  ? {
      [K in keyof YasumuRPC[T]]: `${T & string}.${K & string}`;
    }[keyof YasumuRPC[T]]
  : never;

/**
 * The string representation of all commands in the Yasumu RPC interface.
 */
export type YasumuRpcCommands = ToCommandPathString<keyof YasumuRPC>;

/**
 * A map of all commands in the Yasumu RPC interface to their corresponding data (RpcQuery or RpcMutation).
 */
export type YasumuRpcCommandMap = {
  [K in YasumuRpcCommands]: ExtractRpcTypes<ResolveRpcCommandValue<K>>;
};
