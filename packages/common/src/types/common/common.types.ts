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
