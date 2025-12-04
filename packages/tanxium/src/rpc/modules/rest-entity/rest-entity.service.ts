import { Injectable } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { mapResult } from '@/database/common/index.ts';
import { and, eq } from 'drizzle-orm';
import { restEntities } from '@/database/schema.ts';
import { RestService } from '../rest/rest.service.ts';
import { RestEntityCreateOptions } from '@yasumu/common';
import { NotFoundException } from '../common/exceptions/http.exception.ts';
import { EntityGroupService } from '../entity-group/entity-group.service.ts';
import { EntityOwner } from '../entity-group/types.ts';

@Injectable()
export class RestEntityService {
  public constructor(
    private readonly connection: TransactionalConnection,
    private readonly restService: RestService,
    private readonly entityGroupService: EntityGroupService,
  ) {}

  public async list(workspaceId: string) {
    const db = this.connection.getConnection();
    const restModule = await this.restService.findOneOrCreate(workspaceId);

    const result = await db.query.restEntities.findMany({
      where: eq(restEntities.restId, restModule.id),
    });

    return mapResult(result);
  }

  public async get(workspaceId: string, id: string) {
    const db = this.connection.getConnection();
    const restModule = await this.restService.findOneByWorkspaceId(workspaceId);

    if (!restModule) {
      throw new NotFoundException(
        `Rest module for workspace ${workspaceId} not found`,
      );
    }

    const result = await db.query.restEntities.findFirst({
      where: and(
        eq(restEntities.restId, restModule.id),
        eq(restEntities.id, id),
      ),
    });

    if (!result) {
      throw new NotFoundException(
        `Rest entity ${id} for workspace ${workspaceId} not found`,
      );
    }

    return mapResult(result);
  }

  public async create(workspaceId: string, data: RestEntityCreateOptions) {
    const db = this.connection.getConnection();
    const restModule = await this.restService.findOneByWorkspaceId(workspaceId);

    if (!restModule) {
      throw new NotFoundException(
        `Rest module for workspace ${workspaceId} not found`,
      );
    }

    const [result] = await db
      .insert(restEntities)
      .values({
        restId: restModule.id,
        name: data.name,
        method: data.method,
        url: data.url,
      })
      .returning();

    return mapResult(result);
  }

  public async listTree(workspaceId: string, groupId?: string) {
    const restModule = await this.restService.findOneByWorkspaceId(workspaceId);

    if (!restModule) {
      throw new NotFoundException(
        `Rest module for workspace ${workspaceId} not found`,
      );
    }

    return this.entityGroupService.listTree({
      workspaceId,
      owner: restModule as unknown as EntityOwner,
      entityField: restEntities.restId,
      tableName: 'restEntities',
      entityType: 'rest',
      groupId,
    });
  }
}
