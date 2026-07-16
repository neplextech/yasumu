import type { EntityType, JsonValue } from '../common/common.types.js';

/** The kind of operation represented by an execution history entry. */
export type ExecutionKind = EntityType | 'script' | 'email';

/** The durable lifecycle state of an execution. */
export type ExecutionStatus = 'running' | 'completed' | 'cancelled' | 'failed';

/**
 * A serializable execution history record.
 */
export interface ExecutionHistoryData {
  /** The unique execution ID. */
  executionId: string;
  /** The immediate parent execution, if this is a nested execution. */
  parentExecutionId: string | null;
  /** The root execution shared by the complete nested execution tree. */
  rootExecutionId: string;
  /** The workspace in which the execution ran. */
  workspaceId: string;
  /** The executed entity, or null for a workspace-level operation. */
  entityId: string | null;
  /** The kind of execution. */
  kind: ExecutionKind;
  /** The current or terminal execution status. */
  status: ExecutionStatus;
  /** The execution start time in milliseconds since the Unix epoch. */
  startedAt: number;
  /** The execution completion time, if terminal. */
  completedAt: number | null;
  /** The execution duration, if terminal. */
  durationMs: number | null;
  /** The redacted, serializable execution result. */
  result: JsonValue | null;
}
