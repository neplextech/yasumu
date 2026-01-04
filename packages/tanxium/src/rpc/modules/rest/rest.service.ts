import { Injectable } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { and, eq, isNull } from 'drizzle-orm';
import { entityHistory, restEntities } from '@/database/schema.ts';
import {
  ExecutableScript,
  RestEntityCreateOptions,
  RestEntityUpdateOptions,
  RestScriptContext,
  ScriptExecutionResult,
} from '@yasumu/common';
import { NotFoundException } from '../common/exceptions/http.exception.ts';
import { EntityGroupService } from '../entity-group/entity-group.service.ts';
import { TanxiumService } from '../common/tanxium.service.ts';
import { ScriptRuntimeService } from '../script-runtime/script-runtime.service.ts';
import { REST_CONTEXT_TYPE } from './rest-script-preload.ts';

@Injectable()
export class RestService {
  public constructor(
    private readonly connection: TransactionalConnection,
    private readonly entityGroupService: EntityGroupService,
    private readonly tanxiumService: TanxiumService,
    private readonly scriptRuntimeService: ScriptRuntimeService,
  ) {}

  public async dispatchUpdate(workspaceId: string) {
    await this.tanxiumService.publishMessage('rest-entity-updated', {
      workspaceId,
    });
  }

  public async list(workspaceId: string) {
    const db = this.connection.getConnection();

    const result = await db
      .select()
      .from(restEntities)
      .where(eq(restEntities.workspaceId, workspaceId));

    return result;
  }

  public async listNoGroups(workspaceId: string) {
    const db = this.connection.getConnection();

    const result = await db
      .select()
      .from(restEntities)
      .where(
        and(
          eq(restEntities.workspaceId, workspaceId),
          isNull(restEntities.groupId),
        ),
      );

    return result;
  }

  public async get(workspaceId: string, id: string) {
    const db = this.connection.getConnection();

    const [result] = await db
      .select()
      .from(restEntities)
      .where(
        and(eq(restEntities.workspaceId, workspaceId), eq(restEntities.id, id)),
      );

    if (!result) {
      throw new NotFoundException(
        `Rest entity ${id} for workspace ${workspaceId} not found`,
      );
    }

    return result;
  }

  public async create(workspaceId: string, data: RestEntityCreateOptions) {
    const db = this.connection.getConnection();

    const [result] = await db
      .insert(restEntities)
      .values({
        workspaceId,
        name: data.name,
        method: data.method,
        url: data.url,
        groupId: data.groupId,
      })
      .returning();

    await this.dispatchUpdate(workspaceId);

    return result;
  }

  public async update(
    workspaceId: string,
    id: string,
    data: Partial<RestEntityUpdateOptions>,
  ) {
    const db = this.connection.getConnection();

    const [result] = await db
      .update(restEntities)
      .set(data)
      .where(
        and(eq(restEntities.id, id), eq(restEntities.workspaceId, workspaceId)),
      )
      .returning();

    if (data.name || data.method) await this.dispatchUpdate(workspaceId);

    return result;
  }

  public async delete(workspaceId: string, id: string) {
    const db = this.connection.getConnection();

    await db
      .delete(restEntities)
      .where(
        and(eq(restEntities.id, id), eq(restEntities.workspaceId, workspaceId)),
      );

    // Delete associated history entry
    await db
      .delete(entityHistory)
      .where(
        and(
          eq(entityHistory.entityId, id),
          eq(entityHistory.workspaceId, workspaceId),
        ),
      );

    await this.dispatchUpdate(workspaceId);

    // Dispatch history update event
    await this.tanxiumService.publishMessage('entity-history-updated', {
      workspaceId,
    });
  }

  public listTree(workspaceId: string) {
    return this.entityGroupService.listTree({
      workspaceId,
      entityType: 'rest',
    });
  }

  public executeScript(
    workspaceId: string,
    entity: ExecutableScript<RestScriptContext>,
  ): Promise<ScriptExecutionResult<RestScriptContext>> {
    return this.scriptRuntimeService.executeScript<
      RestScriptContext,
      ExecutableScript<RestScriptContext>
    >(workspaceId, entity, REST_CONTEXT_TYPE);
  }
}
