import type { EmailProvider } from '@yasumu/headless';
import type { WorkspaceEmail } from '@yasumu/runtime-api';
import { and, asc, eq, gt, gte, or } from 'drizzle-orm';

import { emails, smtp } from '../../database/schema.ts';
import type { HeadlessDrizzleDatabase } from './database.ts';
import { mapEmail } from './mappers.ts';

const DEFAULT_EMAIL_LIMIT = 100;
const POLL_INTERVAL_MS = 50;

/** A persisted, race-free email provider backed by the workspace mailbox. */
export class DrizzleEmailProvider implements EmailProvider {
  public constructor(private readonly database: HeadlessDrizzleDatabase) {}

  // Drizzle's Node SQLite driver is synchronous while the headless port is asynchronous.
  // deno-lint-ignore require-await
  public async list(
    workspaceId: string,
    options: { since: number; limit?: number },
    signal?: AbortSignal,
  ): Promise<WorkspaceEmail[]> {
    signal?.throwIfAborted();
    const smtpRow = this.database.select({ id: smtp.id }).from(smtp).where(eq(smtp.workspaceId, workspaceId)).get();
    if (!smtpRow) return [];
    const result = this.database
      .select()
      .from(emails)
      .where(and(eq(emails.smtpId, smtpRow.id), gte(emails.createdAt, options.since)))
      .orderBy(asc(emails.createdAt), asc(emails.id))
      .limit(Math.max(0, options.limit ?? DEFAULT_EMAIL_LIMIT))
      .all()
      .map(mapEmail);
    signal?.throwIfAborted();
    return result;
  }

  public async next(
    workspaceId: string,
    options: { since: number; cursor?: string; timeoutMs?: number },
    signal: AbortSignal,
  ): Promise<{ email: WorkspaceEmail | null; cursor?: string }> {
    const cursor = parseCursor(options.cursor);
    const deadline = options.timeoutMs === undefined ? undefined : Date.now() + Math.max(0, options.timeoutMs);

    while (true) {
      signal.throwIfAborted();
      const next = this.findNext(workspaceId, options.since, cursor);
      if (next) return { email: next, cursor: encodeCursor(next) };
      if (deadline !== undefined && Date.now() >= deadline) return { email: null, cursor: options.cursor };
      const waitMs =
        deadline === undefined ? POLL_INTERVAL_MS : Math.min(POLL_INTERVAL_MS, Math.max(0, deadline - Date.now()));
      await wait(waitMs, signal);
    }
  }

  private findNext(workspaceId: string, since: number, cursor: [number, string] | null): WorkspaceEmail | null {
    const smtpRow = this.database.select({ id: smtp.id }).from(smtp).where(eq(smtp.workspaceId, workspaceId)).get();
    if (!smtpRow) return null;
    const afterCursor = cursor
      ? or(gt(emails.createdAt, cursor[0]), and(eq(emails.createdAt, cursor[0]), gt(emails.id, cursor[1])))
      : undefined;
    const row = this.database
      .select()
      .from(emails)
      .where(and(eq(emails.smtpId, smtpRow.id), gte(emails.createdAt, since), afterCursor))
      .orderBy(asc(emails.createdAt), asc(emails.id))
      .limit(1)
      .get();
    return row ? mapEmail(row) : null;
  }
}

function encodeCursor(email: WorkspaceEmail): string {
  return JSON.stringify([email.createdAt, email.id]);
}

function parseCursor(cursor?: string): [number, string] | null {
  if (!cursor) return null;
  try {
    const value: unknown = JSON.parse(cursor);
    return Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'string'
      ? [value[0], value[1]]
      : null;
  } catch {
    return null;
  }
}

function wait(durationMs: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(done, durationMs);
    signal.addEventListener('abort', aborted, { once: true });

    function done() {
      signal.removeEventListener('abort', aborted);
      resolve();
    }

    function aborted() {
      clearTimeout(timer);
      reject(signal.reason);
    }
  });
}
