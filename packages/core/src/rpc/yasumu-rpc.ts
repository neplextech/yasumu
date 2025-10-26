import type { WorkspaceData } from '@/core/workspace/types.js';
import type { RpcCommand } from './rpc-commands.js';

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

export interface YasumuRPC {
  [RpcCommand.CreateWorkspace]: RpcMutation<[], WorkspaceData>;
  [RpcCommand.GetWorkspace]: RpcQuery<[string], WorkspaceData>;
  [RpcCommand.ListWorkspaces]: RpcQuery<[], WorkspaceData[]>;
}

export interface RpcCommandData<T extends keyof YasumuRPC = keyof YasumuRPC> {
  command: T;
  parameters: InferParameters<YasumuRPC[T]>;
}
