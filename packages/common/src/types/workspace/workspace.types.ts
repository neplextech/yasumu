import type { CommonEntity, CustomMetadata } from '../common/common.types.js';

/**
 * A partial workspace object.
 */
export interface PartialWorkspace extends CommonEntity {
  /**
   * The name of the workspace.
   */
  name: string;
  /**
   * The path of the workspace.
   */
  path: string;
  /**
   * The date and time the workspace was last opened.
   */
  lastOpenedAt: number | null;
}

/**
 * The data for a Yasumu workspace.
 */
export interface WorkspaceData extends CommonEntity {
  /**
   * The name of the workspace.
   */
  name: string;
  /**
   * The version of the workspace.
   */
  version: number;
  /**
   * The path of the workspace.
   */
  path: string;
  /**
   * The date and time the workspace was last opened.
   */
  lastOpenedAt: number | null;
  /**
   * The ID of the active environment.
   */
  activeEnvironmentId: string | null;
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
