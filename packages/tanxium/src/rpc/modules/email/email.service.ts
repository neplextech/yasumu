import { Injectable } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { emails, smtp } from '@/database/schema.ts';
import { and, asc, count, desc, eq, or } from 'drizzle-orm';
import {
  EmailData,
  ListEmailOptions,
  PaginatedResult,
  SmtpConfig,
} from '@yasumu/common';
import { ilike } from 'drizzle-orm/sql';
import { createSmtpServer, SMTPServerInstance } from '@/smtp/server.ts';
import { areDifferentByKeys } from '../../common/utils.ts';

@Injectable()
export class EmailService {
  private readonly servers = new Map<string, SMTPServerInstance>();
  public constructor(private readonly connection: TransactionalConnection) {}

  public getActiveSmtpPort(workspaceId: string): number | null {
    const server = this.servers.get(workspaceId);
    return server?.port ?? null;
  }

  public closeSmtpServer(workspaceId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const existingServer = this.servers.get(workspaceId);
      if (!existingServer) return resolve();

      try {
        existingServer.server.close(resolve);
      } catch (e) {
        reject(e);
      } finally {
        this.servers.delete(workspaceId);
      }
    });
  }

  public async createSmtpServer(workspaceId: string, force: boolean = false) {
    const existingServer = this.servers.get(workspaceId);

    if (force || (existingServer && !existingServer.server.server.listening)) {
      await this.closeSmtpServer(workspaceId).catch((e) => {
        console.error('Failed to close dead SMTP server', e);
        return Yasumu.ui.showNotification({
          title: 'Failed to close SMTP server',
          message:
            'Please try again later. If the problem persists, please restart the application.',
          variant: 'error',
        });
      });
    }

    if (existingServer) return existingServer;

    const config = await this.getSmtp(workspaceId);

    const server = await createSmtpServer({
      workspaceId,
      password: config.password,
      username: config.username,
      port: config.port,
      smtpId: config.id,
    });

    this.servers.set(workspaceId, server);

    return server;
  }

  public async getSmtp(workspaceId: string) {
    const db = this.connection.getConnection();

    const [result] = await db
      .select()
      .from(smtp)
      .where(eq(smtp.workspaceId, workspaceId));

    if (!result) {
      const [res] = await db
        .insert(smtp)
        .values({
          port: 0,
          workspaceId,
        })
        .returning();

      return res;
    }

    return result ?? null;
  }

  public async deleteEmail(workspaceId: string, id: string): Promise<void> {
    const db = this.connection.getConnection();
    const smtp = await this.getSmtp(workspaceId);

    await db
      .delete(emails)
      .where(and(eq(emails.smtpId, smtp.id), eq(emails.id, id)));
  }

  public async getEmail(workspaceId: string, id: string) {
    const db = this.connection.getConnection();
    const smtp = await this.getSmtp(workspaceId);

    const [result] = await db
      .select()
      .from(emails)
      .where(and(eq(emails.smtpId, smtp.id), eq(emails.id, id)));

    await db
      .update(emails)
      .set({ unread: false })
      .where(and(eq(emails.smtpId, smtp.id), eq(emails.id, id)));

    return result ?? null;
  }

  public async listEmails(workspaceId: string, options: ListEmailOptions) {
    const db = this.connection.getConnection();
    const smtp = await this.getSmtp(workspaceId);
    const { search, skip, sort, take, unread } = options;

    const where = and(
      eq(emails.smtpId, smtp.id),
      search
        ? or(
            ilike(emails.subject, `%${search}%`),
            ilike(emails.from, `%${search}%`),
            ilike(emails.to, `%${search}%`),
            ilike(emails.cc, `%${search}%`),
            ilike(emails.html, `%${search}%`),
            ilike(emails.text, `%${search}%`),
          )
        : undefined,
      unread ? eq(emails.unread, unread) : undefined,
    );

    const [{ count: total }] = await db
      .select({ count: count() })
      .from(emails)
      .where(where);

    const result = await db
      .select()
      .from(emails)
      .where(where)
      .orderBy(sort === 'asc' ? asc(emails.createdAt) : desc(emails.createdAt))
      .limit(take ?? 10)
      .offset(skip ?? 0);

    return {
      totalItems: total,
      items: result,
    } satisfies PaginatedResult<EmailData>;
  }

  public async updateSmtpConfig(
    workspaceId: string,
    data: Partial<SmtpConfig>,
  ) {
    const db = this.connection.getConnection();
    const smtpData = await this.getSmtp(workspaceId);

    const [updatedSmtpData] = await db
      .update(smtp)
      .set(data)
      .where(eq(smtp.id, smtpData.id))
      .returning();

    // kill the existing server if the config has changed
    // only applicable if the server is running
    if (
      areDifferentByKeys(updatedSmtpData, smtpData, [
        'password',
        'username',
        'port',
      ]) &&
      this.servers.has(workspaceId)
    ) {
      await this.createSmtpServer(workspaceId, true).catch((e) => {
        console.error('Failed to create SMTP server', e);
        return Yasumu.ui.showNotification({
          title: 'Failed to create SMTP server',
          message:
            'Please try again later. If the problem persists, please restart the application.',
          variant: 'error',
        });
      });
    }
  }
}
