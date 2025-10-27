import type { RpcMutation, RpcQuery } from './yasumu-rpc.js';
import type {
  WorkspaceCreateOptions,
  WorkspaceData,
  RestEntityData,
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
     */
    create: RpcMutation<[WorkspaceCreateOptions], WorkspaceData>;
    /**
     * Workspace retrieval command.
     */
    get: RpcQuery<[string], WorkspaceData>;
    /**
     * Workspace listing command.
     */
    list: RpcQuery<[], WorkspaceData[]>;
  };
  /**
   * The rest commands.
   */
  rest: {
    /**
     * Rest entity creation command.
     */
    create: RpcMutation<[], RestEntityData>;
    /**
     * Rest entity retrieval command.
     */
    get: RpcQuery<[string], RestEntityData>;
    /**
     * Rest entity listing command.
     */
    list: RpcQuery<[], RestEntityData[]>;
  };
}
