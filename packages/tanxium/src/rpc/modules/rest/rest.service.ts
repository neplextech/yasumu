import { EventBus, Injectable } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { mapResult } from '@/database/common/index.ts';
import { rest } from '@/database/schema.ts';
import { eq } from 'drizzle-orm';
import { TanxiumService } from '../common/tanxium.service.ts';
import { FsSyncEvent } from '../common/events/fs-sync.event.ts';

@Injectable()
export class RestService {
  public constructor(
    private readonly connection: TransactionalConnection,
    private readonly tanxiumService: TanxiumService,
    private readonly eventBus: EventBus,
  ) {}

  public async dispatchUpdate(workspaceId: string) {
    await this.tanxiumService.publishMessage('rest-entity-updated', {
      workspaceId,
    });
    await this.eventBus.publish(new FsSyncEvent({ workspaceId }));
  }

  public async findOneByWorkspaceId(workspaceId: string) {
    const db = this.connection.getConnection();
    const result = await db.query.rest.findFirst({
      where: eq(rest.workspaceId, workspaceId),
    });
    return result ? mapResult(result) : null;
  }

  public async findOneOrCreate(workspaceId: string) {
    const rest = await this.findOneByWorkspaceId(workspaceId);
    if (rest) return rest;

    return this.create(workspaceId);
  }

  public async create(workspaceId: string) {
    const db = this.connection.getConnection();
    const [result] = await db
      .insert(rest)
      .values({
        workspaceId,
      })
      .returning();

    return mapResult(result);
  }

  public async list(workspaceId: string) {
    const db = this.connection.getConnection();
    const result = await db.query.restEntities.findMany({
      where: eq(rest.workspaceId, workspaceId),
    });

    return mapResult(result);
  }
}
