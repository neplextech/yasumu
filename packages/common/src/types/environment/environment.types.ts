import type { CustomMetadata, TabularPair } from '../common/common.types.js';

/**
 * The data for a Yasumu environment.
 */
export interface EnvironmentData extends CustomMetadata {
  /**
   * The ID of the environment.
   */
  id: string;
  /**
   * The name of the environment.
   */
  name: string;
  /**
   * The variables of the environment.
   */
  variables: TabularPair[];
  /**
   * The secrets of the environment.
   */
  secrets: TabularPair[];
  /**
   * The created at timestamp of the environment.
   */
  createdAt: number;
  /**
   * The updated at timestamp of the environment.
   */
  updatedAt: number;
  /**
   * The workspace ID of the environment.
   */
  workspaceId: string;
}

/**
 * The options for creating a Yasumu environment.
 */
export interface EnvironmentCreateOptions {
  /**
   * The name of the environment.
   */
  name: string;
  /**
   * The variables of the environment.
   */
  variables?: TabularPair[];
  /**
   * The secrets of the environment.
   */
  secrets?: TabularPair[];
}

/**
 * The options for updating a Yasumu environment.
 */
export interface EnvironmentUpdateOptions extends Partial<CustomMetadata> {
  /**
   * The name of the environment.
   */
  name?: string;
  /**
   * The variables of the environment.
   */
  variables?: TabularPair[];
  /**
   * The secrets of the environment.
   */
  secrets?: TabularPair[];
}
