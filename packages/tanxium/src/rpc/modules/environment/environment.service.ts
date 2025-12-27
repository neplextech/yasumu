import { Injectable } from '@yasumu/den';
import type {
  EnvironmentCreateOptions,
  EnvironmentData,
  EnvironmentUpdateOptions,
} from '@yasumu/common';
import { WorkspacesService } from '../workspaces/workspaces.service.ts';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { environments, workspaces } from '../../../database/schema.ts';
import { and, eq } from 'drizzle-orm';
import { NotFoundException } from '../common/exceptions/http.exception.ts';

@Injectable()
export class EnvironmentsService {
  public constructor(
    private readonly connection: TransactionalConnection,
    private readonly workspacesService: WorkspacesService,
  ) {}

  public async list(workspaceId: string): Promise<EnvironmentData[]> {
    const db = this.connection.getConnection();
    const result = await db
      .select()
      .from(environments)
      .where(eq(environments.workspaceId, workspaceId));

    return result;
  }

  public async get(
    workspaceId: string,
    environmentId: string,
  ): Promise<EnvironmentData | null> {
    const db = this.connection.getConnection();
    const [result] = await db
      .select()
      .from(environments)
      .where(
        and(
          eq(environments.workspaceId, workspaceId),
          eq(environments.id, environmentId),
        ),
      );
    return result ?? null;
  }

  public async create(
    workspaceId: string,
    data: EnvironmentCreateOptions,
  ): Promise<EnvironmentData> {
    const db = this.connection.getConnection();
    const [result] = await db
      .insert(environments)
      .values({
        ...data,
        workspaceId,
      })
      .returning();
    return result;
  }

  public async update(
    workspaceId: string,
    environmentId: string,
    data: EnvironmentUpdateOptions,
  ): Promise<EnvironmentData> {
    const db = this.connection.getConnection();
    const [result] = await db
      .update(environments)
      .set(data)
      .where(
        and(
          eq(environments.workspaceId, workspaceId),
          eq(environments.id, environmentId),
        ),
      )
      .returning();
    return result;
  }

  public async delete(
    workspaceId: string,
    environmentId: string,
  ): Promise<void> {
    const db = this.connection.getConnection();
    await db
      .delete(environments)
      .where(
        and(
          eq(environments.workspaceId, workspaceId),
          eq(environments.id, environmentId),
        ),
      );
  }

  public async setActive(
    workspaceId: string,
    environmentId: string,
  ): Promise<void> {
    const db = this.connection.getConnection();
    await db
      .update(workspaces)
      .set({ activeEnvironmentId: environmentId })
      .where(eq(workspaces.id, workspaceId));
  }

  public async getActive(workspaceId: string): Promise<EnvironmentData | null> {
    const workspace = await this.workspacesService.findOneById(workspaceId);

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    if (!workspace.activeEnvironmentId) {
      return null;
    }

    return this.get(workspaceId, workspace.activeEnvironmentId);
  }
}
