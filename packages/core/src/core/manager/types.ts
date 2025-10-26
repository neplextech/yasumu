/**
 * The options for opening an existing workspace.
 */
export interface WorkspaceOpenOptions {
  /**
   * The ID of the workspace to open.
   */
  id: string;
}

/**
 * The options for creating a new workspace.
 */
export interface WorkspaceCreateOptions {
  /**
   * The arbitrary metadata that will be sent to the underlying adapter when creating the workspace.
   * This could include filesystem paths or other arbitrary data depending on the environment and the adapter.
   */
  metadata: Record<string, unknown>;
  /**
   * The name of the workspace.
   */
  name: string;
}
