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
    const shouldKeepLocal = Yasumu.ui.showConfirmationDialogSync({
      title: 'Conflict Resolution',
      message:
        'The workspace has been modified by another user. Would you like to keep the local version or use their version?',
      yesLabel: 'Keep Local',
      noLabel: 'Keep Remote',
      cancelLabel: 'Cancel',
    });

    return Promise.resolve({ keepLocal: shouldKeepLocal });
  }
}
