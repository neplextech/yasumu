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
