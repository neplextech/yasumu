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

@Injectable()
export class EmailService {
  public constructor(private readonly connection: TransactionalConnection) {}

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

    await db.update(smtp).set(data).where(eq(smtp.id, smtpData.id));
  }
}
