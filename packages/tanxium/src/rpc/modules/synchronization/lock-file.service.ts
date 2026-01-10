import { Injectable } from '@yasumu/den';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type {
  LockFileData,
  LockFileEntry,
  EntityType,
  SyncAction,
  SyncEntityState,
} from './types.ts';
import { createHash } from 'node:crypto';

const LOCK_FILE_NAME = 'yasumu-lock.json';

@Injectable()
export class LockFileService {
  private createEmptyLockFile(): LockFileData {
    return {
      version: 1,
      entities: {
        workspace: {},
        rest: {},
        environment: {},
        smtp: {},
        group: {},
      },
    };
  }

  public getLockFilePath(workspacePath: string): string {
    return join(workspacePath, 'yasumu', LOCK_FILE_NAME);
  }

  public async read(workspacePath: string): Promise<LockFileData> {
    const lockFilePath = this.getLockFilePath(workspacePath);

    if (!existsSync(lockFilePath)) {
      return this.createEmptyLockFile();
    }

    try {
      const content = await Deno.readTextFile(lockFilePath);
      const data = JSON.parse(content) as LockFileData;

      if (!data.entities) {
        return this.createEmptyLockFile();
      }

      return data;
    } catch {
      return this.createEmptyLockFile();
    }
  }

  public async write(workspacePath: string, data: LockFileData): Promise<void> {
    const lockFilePath = this.getLockFilePath(workspacePath);
    const dirPath = join(workspacePath, 'yasumu');

    if (!existsSync(dirPath)) {
      await Deno.mkdir(dirPath, { recursive: true });
    }

    await Deno.writeTextFile(lockFilePath, JSON.stringify(data, null, 2));
  }

  public async getEntry(
    workspacePath: string,
    entityType: EntityType,
    entityId: string,
  ): Promise<LockFileEntry | null> {
    const data = await this.read(workspacePath);
    return data.entities[entityType]?.[entityId] ?? null;
  }

  public async setEntry(
    workspacePath: string,
    entityType: EntityType,
    entityId: string,
    hash: string,
  ): Promise<void> {
    const data = await this.read(workspacePath);

    if (!data.entities[entityType]) {
      data.entities[entityType] = {};
    }

    data.entities[entityType][entityId] = {
      hash,
      lastSyncedAt: Date.now(),
    };

    await this.write(workspacePath, data);
  }

  public async removeEntry(
    workspacePath: string,
    entityType: EntityType,
    entityId: string,
  ): Promise<void> {
    const data = await this.read(workspacePath);

    if (data.entities[entityType]?.[entityId]) {
      delete data.entities[entityType][entityId];
      await this.write(workspacePath, data);
    }
  }

  public computeHash(content: string): string {
    const hash = createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
  }

  public determineSyncAction(state: SyncEntityState): SyncAction {
    const { dbHash, fileHash, lockHash } = state;

    if (!fileHash && !dbHash) {
      return 'none';
    }

    if (!fileHash && dbHash) {
      if (!lockHash) {
        return 'push';
      }
      if (lockHash === dbHash) {
        return 'pull';
      }
      return 'conflict';
    }

    if (fileHash && !dbHash) {
      if (!lockHash) {
        return 'pull';
      }
      if (lockHash === fileHash) {
        return 'push';
      }
      return 'conflict';
    }

    if (fileHash === dbHash) {
      return 'none';
    }

    if (!lockHash) {
      return 'conflict';
    }

    const dbChanged = dbHash !== lockHash;
    const fileChanged = fileHash !== lockHash;

    if (dbChanged && fileChanged) {
      return 'conflict';
    }

    if (dbChanged) {
      return 'push';
    }

    if (fileChanged) {
      return 'pull';
    }

    return 'none';
  }
}
