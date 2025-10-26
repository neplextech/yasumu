import type { YasumuRPC } from './rpc-commands.js';

export type RpcMutation<Params extends unknown[], ReturnType> = {
  $mutate(options: { parameters: Params }): Promise<Awaited<ReturnType>>;
};

export type RpcQuery<Params extends unknown[], ReturnType> = {
  $query(options: { parameters: Params }): Promise<Awaited<ReturnType>>;
};

export type InferParameters<
  T extends RpcMutation<unknown[], unknown> | RpcQuery<unknown[], unknown>,
> =
  T extends RpcMutation<infer Params, unknown>
    ? Params
    : T extends RpcQuery<infer Params, unknown>
      ? Params
      : never;

export type InferReturnType<
  T extends RpcMutation<unknown[], unknown> | RpcQuery<unknown[], unknown>,
> =
  T extends RpcMutation<unknown[], infer ReturnType>
    ? Awaited<ReturnType>
    : T extends RpcQuery<unknown[], infer ReturnType>
      ? Awaited<ReturnType>
      : never;

type TraverseDeep<T> =
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

type ExtractRpcTypes<T> = T[keyof T] extends never
  ? never
  : T[keyof T] extends
        | RpcMutation<unknown[], unknown>
        | RpcQuery<unknown[], unknown>
    ? T[keyof T]
    : ExtractRpcTypes<T[keyof T]>;

export interface RpcCommandData<T extends keyof YasumuRPC = keyof YasumuRPC> {
  command: T;
  parameters: InferParameters<ExtractRpcTypes<TraverseDeep<YasumuRPC[T]>>>;
}
