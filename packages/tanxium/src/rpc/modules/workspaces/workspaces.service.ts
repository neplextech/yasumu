import { EventBus, Injectable, OnModuleInit } from '@yasumu/den';
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
import { WorkspaceEvent } from '../common/events/workspace.event.ts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { WorkspaceDiscoveryEvent } from '../common/events/workspace-discovery.event.ts';

@Injectable()
export class WorkspacesService implements OnModuleInit {
  private activeWorkspaceId: string | null = null;
  public constructor(
    private readonly connection: TransactionalConnection,
    private readonly workspaceActivatorService: WorkspaceActivatorService,
    private readonly emailService: EmailService,
    private readonly eventBus: EventBus,
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

  private pathContainsYasumuFiles(path: string): boolean {
    const hasYasumuFiles = existsSync(join(path, 'yasumu', 'workspace.ysl'));
    return hasYasumuFiles;
  }

  public async create(data: WorkspaceCreateOptions): Promise<WorkspaceData> {
    const db = this.connection.getConnection();
    const existingWorkspace = await this.findOneByPath(data.metadata.path);

    if (existingWorkspace) {
      return existingWorkspace;
    }

    const hasYasumuFiles = await this.pathContainsYasumuFiles(
      data.metadata.path,
    );

    if (hasYasumuFiles) {
      // the target path probably contains yasumu files
      // so we need to treat it as the source of truth
      // and create a new workspace with the contents from that location
      const { promise, resolve } =
        Promise.withResolvers<WorkspaceData | null>();

      const completeCallback = async (workspace: WorkspaceData | null) => {
        await resolve(workspace);
      };

      await this.eventBus.publish(
        new WorkspaceDiscoveryEvent(
          { workspaceId: null },
          data.metadata.path,
          completeCallback,
        ),
      );

      const result = await promise;

      // workspace was discovered
      if (result) return result;
    }

    // workspace was not discovered, create a new one
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
    const workspace = await this.workspaceActivatorService.activate(id);
    this.activeWorkspaceId = workspace.id;

    await this.emailService.createSmtpServer(id).catch((e) => {
      console.error('Failed to create SMTP server for workspace', id, e);
      return Yasumu.ui.showNotification({
        title: 'Failed to create SMTP server',
        message:
          'Please try again later. If the problem persists, please restart the application.',
        variant: 'error',
      });
    });

    console.log(`Workspace ${id} activated`);
    await this.eventBus.publish(
      new WorkspaceEvent({ workspaceId: id }, id, workspace.path, 'activated'),
    );
  }

  public async deactivate(id: string) {
    this.activeWorkspaceId = null;
    const workspace = await this.findOneById(id);
    if (!workspace) return;

    await this.emailService.closeSmtpServer(id).catch((e) => {
      console.error('Failed to close SMTP server for workspace', id, e);
      return Yasumu.ui.showNotification({
        title: 'Failed to close SMTP server',
        message:
          'Please try again later. If the problem persists, please restart the application.',
        variant: 'error',
      });
    });

    console.log(`Workspace ${id} deactivated`);
    await this.eventBus.publish(
      new WorkspaceEvent(
        { workspaceId: id },
        id,
        workspace.path,
        'deactivated',
      ),
    );
  }
}
