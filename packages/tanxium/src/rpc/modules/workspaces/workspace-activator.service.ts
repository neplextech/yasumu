import { EventBus, Injectable } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { workspaces } from '@/database/schema.ts';
import { sql, eq } from 'drizzle-orm';
import { FsSyncEvent } from '../common/events/fs-sync.event.ts';

@Injectable()
export class WorkspaceActivatorService {
  public constructor(
    private readonly connection: TransactionalConnection,
    private readonly eventBus: EventBus,
  ) {}

  public async activate(id: string): Promise<string> {
    const db = this.connection.getConnection();

    // update workspace last opened at
    await db
      .update(workspaces)
      .set({
        lastOpenedAt: sql`(current_timestamp)`,
      })
      .where(eq(workspaces.id, id));

    await this.eventBus.publish(new FsSyncEvent({ workspaceId: id }));

    return id;
  }
}
