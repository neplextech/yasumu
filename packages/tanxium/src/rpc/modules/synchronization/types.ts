export type EntityType =
  | 'workspace'
  | 'rest'
  | 'environment'
  | 'smtp'
  | 'group';

export interface LockFileEntry {
  hash: string;
  lastSyncedAt: number;
}

export interface LockFileData {
  version: 1;
  entities: Record<EntityType, Record<string, LockFileEntry>>;
}

export interface SyncEntityState {
  entityType: EntityType;
  entityId: string;
  dbHash: string | null;
  fileHash: string | null;
  lockHash: string | null;
}

export type SyncAction = 'none' | 'pull' | 'push' | 'conflict';

export interface SyncDecision {
  action: SyncAction;
  state: SyncEntityState;
}
