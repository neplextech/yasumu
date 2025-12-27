import { Injectable } from '@yasumu/den';
import type { SyncEntityState } from './types.ts';

export interface ConflictResolution {
  keepLocal: boolean;
}

export interface IConflictResolver {
  resolve(state: SyncEntityState): Promise<ConflictResolution>;
}

@Injectable()
export class ConflictResolver implements IConflictResolver {
  public resolve(_state: SyncEntityState): Promise<ConflictResolution> {
    return Promise.resolve({ keepLocal: true });
  }
}
