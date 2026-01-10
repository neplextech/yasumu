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
  public resolve(state: SyncEntityState): Promise<ConflictResolution> {
    const MESSAGE = `A conflict has been detected for the ${state.entityType} entity with ID ${state.entityId}. Would you like to keep the local version or use workspace file's version?\n\nNote: Choosing "Cancel" will also preserve the local version.`;
    const shouldKeepLocal = Yasumu.ui.showConfirmationDialogSync({
      title: 'Conflict Resolution',
      message: MESSAGE,
      yesLabel: 'Keep Local',
      noLabel: 'Keep Remote',
      cancelLabel: 'Cancel',
    });

    return Promise.resolve({ keepLocal: shouldKeepLocal });
  }
}
