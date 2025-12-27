import { Injectable, OnModuleInit } from '@yasumu/den';
import type { WorkspaceCreateOptions, WorkspaceData } from '@yasumu/common';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { desc, eq } from 'drizzle-orm';
import { workspaces } from '@/database/schema.ts';
import {
  DEFAULT_WORKSPACE_NAME,
  DEFAULT_WORKSPACE_PATH,
  PATH_IDENTIFIER_PREFIX,
} from '../../common/constants.ts';
import { WorkspaceActivatorService } from './workspace-activator.service.ts';
import { EmailService } from '../email/email.service.ts';

@Injectable()
export class WorkspacesService implements OnModuleInit {
  private activeWorkspaceId: string | null = null;
  public constructor(
    private readonly connection: TransactionalConnection,
    private readonly workspaceActivatorService: WorkspaceActivatorService,
    private readonly emailService: EmailService,
  ) {}

  public async onModuleInit() {
    // seed default workspace
    await this.getDefaultWorkspace();
  }

  public async getDefaultWorkspace(): Promise<WorkspaceData> {
    const db = this.connection.getConnection();
    const existingWorkspace = await this.findOneByPath(DEFAULT_WORKSPACE_PATH);

    if (existingWorkspace) {
      return existingWorkspace;
    }

    const [result] = await db
      .insert(workspaces)
      .values({
        name: DEFAULT_WORKSPACE_NAME,
        path: DEFAULT_WORKSPACE_PATH,
        metadata: {
          path: DEFAULT_WORKSPACE_PATH,
        },
      })
      .returning();

    return result;
  }

  public async list({ take }: { take?: number }): Promise<WorkspaceData[]> {
    take ??= 10;
    const db = this.connection.getConnection();
    const result = await db
      .select()
      .from(workspaces)
      .orderBy(desc(workspaces.lastOpenedAt))
      .limit(take);

    return result;
  }

  public async findOneByPath(path: string): Promise<WorkspaceData | null> {
    const db = this.connection.getConnection();
    const [result] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.path, path));

    return result ?? null;
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
      // special case for the default workspace
      // this also ensures that the default workspace is always available
      if (_id === DEFAULT_WORKSPACE_PATH) {
        return this.getDefaultWorkspace();
      }

      return this.findOneByPath(_id);
    }

    const db = this.connection.getConnection();
    const [result] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, _id));

    return result ?? null;
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

    return result;
  }

  // deno-lint-ignore require-await
  public async getActiveWorkspaceId(): Promise<string | null> {
    return this.activeWorkspaceId;
  }

  public async activate(id: string) {
    this.activeWorkspaceId = await this.workspaceActivatorService.activate(id);

    await this.emailService.createSmtpServer(id).catch((e) => {
      console.error('Failed to create SMTP server for workspace', id, e);
      return Yasumu.ui.showNotification({
        title: 'Failed to create SMTP server',
        message:
          'Please try again later. If the problem persists, please restart the application.',
        variant: 'error',
      });
    });
  }

  public async deactivate(id: string) {
    this.activeWorkspaceId = null;
    await this.emailService.closeSmtpServer(id).catch((e) => {
      console.error('Failed to close SMTP server for workspace', id, e);
      return Yasumu.ui.showNotification({
        title: 'Failed to close SMTP server',
        message:
          'Please try again later. If the problem persists, please restart the application.',
        variant: 'error',
      });
    });
  }
}
