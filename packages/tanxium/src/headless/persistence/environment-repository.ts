import type { WorkspaceEnvironment } from '@yasumu/headless';
import { YasumuError, YasumuErrorCodes } from '@yasumu/headless';
import { and, eq } from 'drizzle-orm';

import { environments, workspaces } from '../../database/schema.ts';
import type { HeadlessDrizzleDatabase } from './database.ts';
import { mapEnvironment, storedEnvironmentValues } from './mappers.ts';
import { loadSourceRevision } from './source-revisions.ts';

/**
 * SQLite environment persistence used by the GUI host.
 *
 * This remains an explicit adapter because the headless package does not yet
 * expose an EnvironmentRepository port.
 */
export class DrizzleEnvironmentRepository {
  public constructor(private readonly database: HeadlessDrizzleDatabase) {}

  // Drizzle's Node SQLite driver is synchronous while this adapter exposes an asynchronous API.
  // deno-lint-ignore require-await
  public async get(workspaceId: string, environmentId: string): Promise<WorkspaceEnvironment | null> {
    const row = this.database
      .select()
      .from(environments)
      .where(and(eq(environments.workspaceId, workspaceId), eq(environments.id, environmentId)))
      .get();
    if (!row) return null;
    return mapEnvironment(row, loadSourceRevision(this.database, workspaceId, 'environment', environmentId));
  }

  // deno-lint-ignore require-await
  public async list(workspaceId: string): Promise<WorkspaceEnvironment[]> {
    return this.database
      .select()
      .from(environments)
      .where(eq(environments.workspaceId, workspaceId))
      .all()
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((row) => mapEnvironment(row, loadSourceRevision(this.database, workspaceId, 'environment', row.id)));
  }

  public async save(environment: WorkspaceEnvironment): Promise<WorkspaceEnvironment> {
    if (
      !this.database
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.id, environment.workspaceId))
        .get()
    ) {
      throw new YasumuError(YasumuErrorCodes.WorkspaceNotFound, `Workspace not found: ${environment.workspaceId}`, {
        workspaceId: environment.workspaceId,
      });
    }
    const existing = this.database
      .select({ workspaceId: environments.workspaceId })
      .from(environments)
      .where(eq(environments.id, environment.id))
      .get();
    if (existing && existing.workspaceId !== environment.workspaceId) {
      throw new YasumuError(
        YasumuErrorCodes.InvalidReference,
        `Environment ID belongs to another workspace: ${environment.id}`,
        { workspaceId: environment.workspaceId },
      );
    }
    const values = storedEnvironmentValues(environment);
    this.database
      .insert(environments)
      .values({
        id: environment.id,
        workspaceId: environment.workspaceId,
        name: environment.name,
        ...values,
      })
      .onConflictDoUpdate({
        target: environments.id,
        set: {
          name: environment.name,
          ...values,
          updatedAt: Date.now(),
        },
      })
      .run();
    return (await this.get(environment.workspaceId, environment.id))!;
  }

  // deno-lint-ignore require-await
  public async delete(workspaceId: string, environmentId: string): Promise<void> {
    this.database
      .delete(environments)
      .where(and(eq(environments.workspaceId, workspaceId), eq(environments.id, environmentId)))
      .run();
  }

  public async setActive(workspaceId: string, environmentId: string | null): Promise<void> {
    if (environmentId && !(await this.get(workspaceId, environmentId))) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Environment not found: ${environmentId}`, {
        workspaceId,
      });
    }
    this.database
      .update(workspaces)
      .set({ activeEnvironmentId: environmentId })
      .where(eq(workspaces.id, workspaceId))
      .run();
  }
}
