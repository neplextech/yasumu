import type {
  ExtractRpcTypes,
  InferParameters,
  InferReturnType,
  RpcMutation,
  RpcQuery,
} from './yasumu-rpc.js';
import type {
  WorkspaceCreateOptions,
  WorkspaceData,
  RestEntityData,
  RestEntityCreateOptions,
  EntityGroupCreateOptions,
  EntityGroupData,
  RestEntityUpdateOptions,
  SmtpConfig,
  ListEmailOptions,
  EmailData,
  PaginatedResult,
  RestEntityExecutionResult,
  ScriptableEntity,
  EnvironmentData,
  EnvironmentUpdateOptions,
  EnvironmentCreateOptions,
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
    create: RpcMutation<[data: WorkspaceCreateOptions], WorkspaceData>;
    /**
     * Workspace retrieval command.
     * @param id The ID of the workspace.
     */
    get: RpcQuery<[id: string], WorkspaceData>;
    /**
     * Workspace listing command.
     * @returns The list of workspaces.
     */
    list: RpcQuery<[options: { take?: number }], WorkspaceData[]>;
    /**
     * Workspace activation command.
     */
    activate: RpcMutation<[id: string], void>;
    /**
     * Workspace deactivation command.
     */
    deactivate: RpcMutation<[id: string], void>;
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
    create: RpcMutation<[data: RestEntityCreateOptions], RestEntityData>;
    /**
     * Rest entity retrieval command.
     * @param id The ID of the rest entity.
     */
    get: RpcQuery<[id: string], RestEntityData>;
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
      [id: string, data: Partial<RestEntityUpdateOptions>],
      RestEntityData
    >;
    /**
     * Rest entity deletion command.
     * @param id The ID of the rest entity.
     */
    delete: RpcMutation<[id: string], void>;
    /**
     * Execute a script on a rest entity.
     * @param entity The entity to execute the script on.
     * @returns The result of the script execution.
     */
    executeScript: RpcMutation<
      [entity: ScriptableEntity],
      RestEntityExecutionResult
    >;
  };
  /**
   * The entity groups commands.
   */
  entityGroups: {
    /**
     * Entity group creation command.
     * @param data The data for the entity group.
     */
    create: RpcMutation<[data: EntityGroupCreateOptions], EntityGroupData>;
  };
  emails: {
    /**
     * Get the port number of the SMTP server.
     * @returns The port number of the SMTP server. Null if the server is not running.
     */
    getSmtpPort: RpcQuery<[], number | null>;
    /**
     * Configure the SMTP server.
     * @param data The data for the SMTP server.
     */
    updateSmtpConfig: RpcMutation<[data: Partial<SmtpConfig>], void>;
    /**
     * Get the SMTP server configuration.
     * @returns The SMTP server configuration.
     */
    getSmtpConfig: RpcQuery<[], SmtpConfig>;
    /**
     * Get the list of emails.
     * @returns The list of emails.
     */
    listEmails: RpcQuery<
      [options: ListEmailOptions],
      PaginatedResult<EmailData>
    >;
    /**
     * Get the email by ID.
     * @param id The ID of the email.
     * @returns The email.
     */
    getEmail: RpcQuery<[id: string], EmailData>;
    /**
     * Delete the email by ID.
     * @param id The ID of the email.
     */
    deleteEmail: RpcMutation<[id: string], void>;
  };
  /**
   * The environments commands.
   */
  environments: {
    /**
     * Get the active environment command.
     * @returns The active environment.
     */
    getActive: RpcQuery<[], EnvironmentData | null>;
    /**
     * Set the active environment command.
     * @param id The ID of the environment to set as active.
     */
    setActive: RpcMutation<[id: string], void>;
    /**
     * Get an environment command.
     * @param id The ID of the environment to get.
     * @returns The environment.
     */
    get: RpcQuery<[id: string], EnvironmentData | null>;
    /**
     * List the environments command.
     * @returns The list of environments.
     */
    list: RpcQuery<[], EnvironmentData[]>;
    /**
     * Create a new environment command.
     * @param name The name of the environment.
     * @returns The created environment.
     */
    create: RpcMutation<[data: EnvironmentCreateOptions], EnvironmentData>;
    /**
     * Update an environment command.
     */
    update: RpcMutation<
      [id: string, data: Partial<EnvironmentUpdateOptions>],
      EnvironmentData
    >;
    /**
     * Delete an environment command.
     * @param id The ID of the environment to delete.
     */
    delete: RpcMutation<[id: string], void>;
  };
}

/**
 * The Yasumu RPC service interface.
 */
export type YasumuRpcService<
  T extends keyof YasumuRPC,
  OmitWorkspaceId extends boolean = false,
> = {
  [K in keyof YasumuRPC[T]]: OmitWorkspaceId extends true
    ? (
        ...args: InferParameters<ExtractRpcTypes<YasumuRPC[T][K]>>
      ) => Promise<InferReturnType<ExtractRpcTypes<YasumuRPC[T][K]>>>
    : (
        workspaceId: string,
        ...args: InferParameters<ExtractRpcTypes<YasumuRPC[T][K]>>
      ) => Promise<InferReturnType<ExtractRpcTypes<YasumuRPC[T][K]>>>;
};
