import { Injectable, OnModuleInit } from '@yasumu/den';
import type { WorkspaceCreateOptions, WorkspaceData } from '@yasumu/common';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { mapResult } from '@/database/common/index.ts';
import { desc, eq, sql } from 'drizzle-orm';
import { workspaces } from '@/database/schema.ts';
import {
  DEFAULT_WORKSPACE_NAME,
  DEFAULT_WORKSPACE_PATH,
  PATH_IDENTIFIER_PREFIX,
} from '../../common/constants.ts';

@Injectable()
export class WorkspacesService implements OnModuleInit {
  private activeWorkspaceId: string | null = null;
  public constructor(private readonly connection: TransactionalConnection) {}

  public async onModuleInit() {
    // ensure the default workspace exists
    await this.getDefaultWorkspace();
  }

  public getDefaultWorkspace(): Promise<WorkspaceData> {
    return this.create({
      name: DEFAULT_WORKSPACE_NAME,
      metadata: {
        path: DEFAULT_WORKSPACE_PATH,
      },
    });
  }

  public async list({ take }: { take?: number }): Promise<WorkspaceData[]> {
    take ??= 10;
    const db = this.connection.getConnection();
    const result = await db
      .select()
      .from(workspaces)
      .orderBy(desc(workspaces.lastOpenedAt))
      .limit(take);

    // @ts-expect-error types
    return mapResult(result);
  }

  public async findOneByPath(path: string): Promise<WorkspaceData | null> {
    const db = this.connection.getConnection();
    const [result] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.path, path));

    // @ts-expect-error types
    return result ? mapResult(result) : null;
  }

  private resolveId(id: string) {
    const isPathIdentifier = id.startsWith(PATH_IDENTIFIER_PREFIX);

    if (isPathIdentifier) {
      const parsedId = id.slice(PATH_IDENTIFIER_PREFIX.length);
      return [parsedId, true] as const;
    }

    return [id, false] as const;
  }

  public async findOneById(id: string): Promise<WorkspaceData | null> {
    const [_id, isPath] = this.resolveId(id);

    if (isPath) {
      return this.findOneByPath(_id);
    }

    const db = this.connection.getConnection();
    const [result] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, _id));
    // @ts-expect-error types
    return result ? mapResult(result) : null;
  }

  public async create(data: WorkspaceCreateOptions): Promise<WorkspaceData> {
    const db = this.connection.getConnection();
    const existingWorkspace = await this.findOneByPath(data.metadata.path);

    if (existingWorkspace) {
      return existingWorkspace;
    }

    const [result] = await db
      .insert(workspaces)
      .values({
        name: data.name,
        path: data.metadata.path,
        metadata: {
          path: data.metadata.path,
        },
      })
      .returning();

    // @ts-expect-error types
    return mapResult(result);
  }

  public getActiveWorkspaceId(): string | null {
    return this.activeWorkspaceId;
  }

  public async activate(id: string) {
    this.activeWorkspaceId = id;
    const db = this.connection.getConnection();

    await db
      .update(workspaces)
      .set({
        lastOpenedAt: sql`(current_timestamp)`,
      })
      .where(eq(workspaces.id, id));
  }

  public deactivate(id: string) {
    void id;
    this.activeWorkspaceId = null;
  }
}
