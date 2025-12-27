import { Injectable } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { workspaces } from '@/database/schema.ts';
import { eq } from 'drizzle-orm';

@Injectable()
export class WorkspaceActivatorService {
  public constructor(private readonly connection: TransactionalConnection) {}

  public async activate(id: string): Promise<typeof workspaces.$inferSelect> {
    const db = this.connection.getConnection();

    // update workspace last opened at
    const [workspace] = await db
      .update(workspaces)
      .set({
        lastOpenedAt: Date.now(),
      })
      .where(eq(workspaces.id, id))
      .returning();

    return workspace;
  }
}
