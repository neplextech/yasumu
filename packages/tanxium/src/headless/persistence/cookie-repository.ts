import type { CookieRepository, WorkspaceCookie } from '@yasumu/headless';
import { and, eq, lte } from 'drizzle-orm';

import { workspaceCookies } from '../../database/schema.ts';
import type { HeadlessDrizzleDatabase } from './database.ts';

export class DrizzleCookieRepository implements CookieRepository {
  public constructor(private readonly database: HeadlessDrizzleDatabase) {}

  // deno-lint-ignore require-await
  public async list(workspaceId: string): Promise<WorkspaceCookie[]> {
    return this.database
      .select()
      .from(workspaceCookies)
      .where(eq(workspaceCookies.workspaceId, workspaceId))
      .all()
      .map(mapCookie);
  }

  // deno-lint-ignore require-await
  public async upsert(cookie: WorkspaceCookie): Promise<WorkspaceCookie> {
    const existing = this.database.select().from(workspaceCookies).where(eq(workspaceCookies.id, cookie.id)).get();
    if (existing && existing.workspaceId !== cookie.workspaceId) {
      throw new Error(`Cookie belongs to another workspace: ${cookie.id}`);
    }
    this.database
      .insert(workspaceCookies)
      .values(cookie)
      .onConflictDoUpdate({
        target: workspaceCookies.id,
        set: {
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expiresAt: cookie.expiresAt,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite,
          hostOnly: cookie.hostOnly,
          updatedAt: cookie.updatedAt,
        },
      })
      .run();
    const stored = this.database.select().from(workspaceCookies).where(eq(workspaceCookies.id, cookie.id)).get();
    if (!stored || stored.workspaceId !== cookie.workspaceId) throw new Error(`Failed to persist cookie: ${cookie.id}`);
    return mapCookie(stored);
  }

  // deno-lint-ignore require-await
  public async delete(workspaceId: string, cookieId: string): Promise<void> {
    this.database
      .delete(workspaceCookies)
      .where(and(eq(workspaceCookies.workspaceId, workspaceId), eq(workspaceCookies.id, cookieId)))
      .run();
  }

  // deno-lint-ignore require-await
  public async clear(workspaceId: string): Promise<void> {
    this.database.delete(workspaceCookies).where(eq(workspaceCookies.workspaceId, workspaceId)).run();
  }

  // deno-lint-ignore require-await
  public async deleteExpired(workspaceId: string, now: number): Promise<void> {
    this.database
      .delete(workspaceCookies)
      .where(and(eq(workspaceCookies.workspaceId, workspaceId), lte(workspaceCookies.expiresAt, now)))
      .run();
  }
}

function mapCookie(row: typeof workspaceCookies.$inferSelect): WorkspaceCookie {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    value: row.value,
    domain: row.domain,
    path: row.path,
    expiresAt: row.expiresAt,
    secure: row.secure,
    httpOnly: row.httpOnly,
    sameSite: row.sameSite,
    hostOnly: row.hostOnly,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
