/**
 * A partial workspace object.
 */
export interface PartialWorkspace {
  /**
   * The ID of the workspace.
   */
  id: string;
  /**
   * The name of the workspace.
   */
  name: string;
}

/**
 * The data for a Yasumu workspace.
 */
export interface WorkspaceData {
  /**
   * The ID of the workspace.
   */
  id: string;
  /**
   * The name of the workspace.
   */
  name: string;
  /**
   * The metadata of the workspace.
   */
  metadata: Record<string, unknown>;
  /**
   * The date and time the workspace was created.
   */
  createdAt: Date;
  /**
   * The date and time the workspace was last updated.
   */
  updatedAt: Date;
}

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
