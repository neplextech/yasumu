import type { EntityType } from '../common/common.types.js';

/**
 * The data of an entity history entry.
 */
export interface EntityHistoryData {
  /**
   * The unique identifier of the history entry.
   */
  id: string;
  /**
   * The type of the entity (rest, graphql, websocket, etc.).
   */
  entityType: EntityType;
  /**
   * The workspace ID this history belongs to.
   */
  workspaceId: string;
  /**
   * The ID of the entity that was accessed.
   */
  entityId: string;
  /**
   * The timestamp when the entity was accessed.
   */
  createdAt: number;
  /**
   * The timestamp when the history entry was last updated.
   */
  updatedAt: number;
}

/**
 * The options for creating an entity history entry.
 */
export interface EntityHistoryCreateOptions {
  /**
   * The type of the entity.
   */
  entityType: EntityType;
  /**
   * The ID of the entity that was accessed.
   */
  entityId: string;
}

/**
 * The options for listing entity history.
 */
export interface EntityHistoryListOptions {
  /**
   * The type of entity to filter by.
   */
  entityType?: EntityType;
  /**
   * The maximum number of items to return.
   */
  limit?: number;
}

