import type { EntityType } from '../common/common.types.js';

/**
 * The options for creating an entity group.
 */
export interface EntityGroupCreateOptions {
  /**
   * The name of the entity group.
   */
  name: string;
  /**
   * The parent ID of the entity group.
   */
  parentId: string | null;
  /**
   * The type of the entity.
   */
  entityType: EntityType;
}

/**
 * The options for updating an entity group.
 */
export interface EntityGroupUpdateOptions {
  /**
   * The name of the entity group.
   */
  name?: string;
  /**
   * The parent ID of the entity group.
   */
  parentId?: string | null;
}

export interface EntityGroupData {
  /**
   * The id of the entity group.
   */
  id: string;
  /**
   * The name of the entity group.
   */
  name: string;
  /**
   * The parent ID of the entity group.
   */
  parentId: string | null;
  /**
   * The type of the entity.
   */
  entityType: EntityType;
  /**
   * The entity owner ID.
   */
  entityOwnerId: string;
}
