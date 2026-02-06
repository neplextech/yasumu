import { Injectable } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { and, eq, isNull } from 'drizzle-orm';
import { entityHistory, graphqlEntities } from '@/database/schema.ts';
import {
  ExecutableScript,
  GraphqlEntityCreateOptions,
  GraphqlEntityUpdateOptions,
  GraphqlScriptContext,
  ScriptExecutionResult,
} from '@yasumu/common';
import { NotFoundException } from '../common/exceptions/http.exception.ts';
import { EntityGroupService } from '../entity-group/entity-group.service.ts';
import { TanxiumService } from '../common/tanxium.service.ts';
import { ScriptRuntimeService } from '../script-runtime/script-runtime.service.ts';
import { GRAPHQL_CONTEXT_TYPE } from './graphql-script-preload.ts';

@Injectable()
export class GraphqlService {
  public constructor(
    private readonly connection: TransactionalConnection,
    private readonly entityGroupService: EntityGroupService,
    private readonly tanxiumService: TanxiumService,
    private readonly scriptRuntimeService: ScriptRuntimeService,
  ) {}

  public async dispatchUpdate(workspaceId: string) {
    await this.tanxiumService.publishMessage('graphql-entity-updated', {
      workspaceId,
    });
  }

  public async list(workspaceId: string) {
    const db = this.connection.getConnection();

    const result = await db
      .select()
      .from(graphqlEntities)
      .where(eq(graphqlEntities.workspaceId, workspaceId));

    return result;
  }

  public async listNoGroups(workspaceId: string) {
    const db = this.connection.getConnection();

    const result = await db
      .select()
      .from(graphqlEntities)
      .where(
        and(
          eq(graphqlEntities.workspaceId, workspaceId),
          isNull(graphqlEntities.groupId),
        ),
      );

    return result;
  }

  public async get(workspaceId: string, id: string) {
    const db = this.connection.getConnection();

    const [result] = await db
      .select()
      .from(graphqlEntities)
      .where(
        and(
          eq(graphqlEntities.workspaceId, workspaceId),
          eq(graphqlEntities.id, id),
        ),
      );

    if (!result) {
      throw new NotFoundException(
        `Graphql entity ${id} for workspace ${workspaceId} not found`,
      );
    }

    return result;
  }

  public async create(workspaceId: string, data: GraphqlEntityCreateOptions) {
    const db = this.connection.getConnection();

    const [result] = await db
      .insert(graphqlEntities)
      .values({
        workspaceId,
        name: data.name,
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
    data: Partial<GraphqlEntityUpdateOptions>,
  ) {
    const db = this.connection.getConnection();

    const [result] = await db
      .update(graphqlEntities)
      .set(data)
      .where(
        and(
          eq(graphqlEntities.id, id),
          eq(graphqlEntities.workspaceId, workspaceId),
        ),
      )
      .returning();

    if (data.name) await this.dispatchUpdate(workspaceId);

    return result;
  }

  public async delete(workspaceId: string, id: string) {
    const db = this.connection.getConnection();

    await db
      .delete(graphqlEntities)
      .where(
        and(
          eq(graphqlEntities.id, id),
          eq(graphqlEntities.workspaceId, workspaceId),
        ),
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
      entityType: 'graphql',
    });
  }

  public async executeScript(
    workspaceId: string,
    entity: ExecutableScript<GraphqlScriptContext>,
  ): Promise<ScriptExecutionResult<GraphqlScriptContext>> {
    const result = await this.scriptRuntimeService.executeScript<
      GraphqlScriptContext,
      ExecutableScript<GraphqlScriptContext>
    >(workspaceId, entity, GRAPHQL_CONTEXT_TYPE);

    return result;
  }
}
