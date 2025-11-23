import type { RpcMutation, RpcQuery } from './yasumu-rpc.js';
import type {
  WorkspaceCreateOptions,
  WorkspaceData,
  RestEntityData,
  RestEntityCreateOptions,
} from '@yasumu/common';

/**
 * The Yasumu RPC interface.
 */
export interface YasumuRPC {
  /**
   * The workspaces commands.
   */
  workspaces: {
    /**
     * Workspace creation command.
     * @param data The data for the workspace.
     */
    create: RpcMutation<[WorkspaceCreateOptions], WorkspaceData>;
    /**
     * Workspace retrieval command.
     * @param id The ID of the workspace.
     */
    get: RpcQuery<[string], WorkspaceData>;
    /**
     * Workspace listing command.
     * @returns The list of workspaces.
     */
    list: RpcQuery<[], WorkspaceData[]>;
  };
  /**
   * The rest commands.
   */
  rest: {
    /**
     * Rest entity creation command.
     * @param data The data for the rest entity.
     */
    create: RpcMutation<[RestEntityCreateOptions], RestEntityData>;
    /**
     * Rest entity retrieval command.
     * @param id The ID of the rest entity.
     */
    get: RpcQuery<[string], RestEntityData>;
    /**
     * Rest entity listing command.
     * @returns The list of rest entities.
     */
    list: RpcQuery<[], RestEntityData[]>;
  };
}
