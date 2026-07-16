import type { CommonEntity, EntityType, JsonValue } from '../common/common.types.js';

/** The kind of record represented by a source revision. */
export type SourceEntityKind = 'workspace' | 'entity-group' | 'environment' | 'smtp' | EntityType;

/**
 * Durable three-way reconciliation state for one workspace record.
 */
export interface SourceRevisionData extends CommonEntity {
  /** The workspace that owns the source record. */
  workspaceId: string;
  /** The kind of record represented by the source file. */
  entityKind: SourceEntityKind;
  /** The stable ID of the represented record. */
  entityId: string;
  /** The workspace-relative path of the source file. */
  sourcePath: string;
  /** The content hash or stable revision last imported from the source. */
  sourceRevision: string;
  /** The normalized source value at the last successful reconciliation. */
  sourceSnapshot: JsonValue;
  /** The normalized database value at the last successful reconciliation. */
  databaseSnapshot: JsonValue | null;
}
