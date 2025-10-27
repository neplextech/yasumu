import type { CustomMetadata } from '../common/common.types.js';

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
export interface WorkspaceData extends CustomMetadata {
  /**
   * The ID of the workspace.
   */
  id: string;
  /**
   * The name of the workspace.
   */
  name: string;
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
export interface WorkspaceCreateOptions extends CustomMetadata {
  /**
   * The name of the workspace.
   */
  name: string;
}
