import type { RpcMutation, RpcQuery } from './yasumu-rpc.js';
import type {
  WorkspaceCreateOptions,
  WorkspaceData,
  RestEntityData,
  RestEntityCreateOptions,
  EntityGroupCreateOptions,
  EntityGroupData,
  RestEntityUpdateOptions,
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
    list: RpcQuery<[{ take?: number }], WorkspaceData[]>;
    /**
     * Workspace activation command.
     */
    activate: RpcMutation<[string], void>;
    /**
     * Workspace deactivation command.
     */
    deactivate: RpcMutation<[string], void>;
    /**
     * Get the active workspace ID command.
     * @returns The active workspace ID.
     */
    active: RpcQuery<[], string | null>;
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
    /**
     * Rest entity listing command.
     * @returns The list of rest entities.
     */
    listTree: RpcQuery<[], RestEntityData[]>;
    /**
     * Rest entity update command.
     * @param id The ID of the rest entity.
     * @param data The data for the rest entity.
     */
    update: RpcMutation<
      [string, Partial<RestEntityUpdateOptions>],
      RestEntityData
    >;
    /**
     * Rest entity deletion command.
     * @param id The ID of the rest entity.
     */
    delete: RpcMutation<[string], void>;
  };
  /**
   * The entity groups commands.
   */
  entityGroups: {
    /**
     * Entity group creation command.
     * @param data The data for the entity group.
     */
    create: RpcMutation<[EntityGroupCreateOptions], EntityGroupData>;
  };
}
