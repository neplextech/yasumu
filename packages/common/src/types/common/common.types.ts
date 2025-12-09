/**
 * The script of the request.
 */
export interface YasumuScript {
  /**
   * The type of the script.
   */
  type: 'beforeRequest' | 'afterRequest';
  /**
   * The code of the script.
   */
  code: string;
}

/**
 * Represents a key-value pair with an optional enabled flag, commonly represented in tabular form.
 */
export interface TabularPair {
  /**
   * The key of the pair.
   */
  key: string;
  /**
   * The value of the pair.
   */
  value: string;
  /**
   * Whether the pair is enabled.
   */
  enabled: boolean;
}

/**
 * The custom metadata that can be associated with an entity.
 */
export interface CustomMetadata {
  /**
   * The arbitrary data that can be associated with an entity.
   * This can be used to store arbitrary data that is not part of the schema.
   */
  metadata: any;
}

/**
 * The type of the entity.
 */
export type EntityType = 'rest' | 'graphql' | 'websocket' | 'socketio' | 'sse';

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
