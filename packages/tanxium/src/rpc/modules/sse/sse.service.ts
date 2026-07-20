import type { SseEntityCreateOptions, SseEntityUpdateOptions } from '@yasumu/common';
import { Injectable } from '@yasumu/den';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import { entityHistory, sseEntities, sseEntityDependencies } from '@/database/schema.ts';

import { NotFoundException } from '../common/exceptions/http.exception.ts';
import { TanxiumService } from '../common/tanxium.service.ts';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { EntityGroupService } from '../entity-group/entity-group.service.ts';

@Injectable()
export class SseService {
  public constructor(
    private readonly connection: TransactionalConnection,
    private readonly entityGroupService: EntityGroupService,
    private readonly tanxiumService: TanxiumService,
  ) {}

  private dispatchUpdate(workspaceId: string) {
    return this.tanxiumService.publishMessage('sse-entity-updated', { workspaceId });
  }

  public async list(workspaceId: string) {
    const entities = await this.connection
      .getConnection()
      .select()
      .from(sseEntities)
      .where(eq(sseEntities.workspaceId, workspaceId));
    return this.attachDependencies(entities);
  }

  public async listNoGroups(workspaceId: string) {
    const entities = await this.connection
      .getConnection()
      .select()
      .from(sseEntities)
      .where(and(eq(sseEntities.workspaceId, workspaceId), isNull(sseEntities.groupId)));
    return this.attachDependencies(entities);
  }

  public async get(workspaceId: string, id: string) {
    const [entity] = await this.connection
      .getConnection()
      .select()
      .from(sseEntities)
      .where(and(eq(sseEntities.workspaceId, workspaceId), eq(sseEntities.id, id)));
    if (!entity) throw new NotFoundException(`SSE entity ${id} for workspace ${workspaceId} not found`);
    return (await this.attachDependencies([entity]))[0]!;
  }

  public async create(workspaceId: string, data: SseEntityCreateOptions) {
    const { dependencies = [], ...values } = data;
    const [entity] = await this.connection
      .getConnection()
      .insert(sseEntities)
      .values({
        ...values,
        workspaceId,
      })
      .returning();
    await this.replaceDependencies(entity!.id, dependencies);
    await this.dispatchUpdate(workspaceId);
    return { ...entity!, dependencies };
  }

  public async update(workspaceId: string, id: string, data: Partial<SseEntityUpdateOptions>) {
    const { dependencies, ...values } = data;
    const database = this.connection.getConnection();
    const [entity] = Object.keys(values).length
      ? await database
          .update(sseEntities)
          .set(values)
          .where(and(eq(sseEntities.id, id), eq(sseEntities.workspaceId, workspaceId)))
          .returning()
      : await database
          .select()
          .from(sseEntities)
          .where(and(eq(sseEntities.id, id), eq(sseEntities.workspaceId, workspaceId)));
    if (!entity) throw new NotFoundException(`SSE entity ${id} for workspace ${workspaceId} not found`);
    if (dependencies) await this.replaceDependencies(id, dependencies);
    if (data.name !== undefined || data.method !== undefined || data.groupId !== undefined) {
      await this.dispatchUpdate(workspaceId);
    }
    return { ...entity, dependencies: dependencies ?? (await this.dependenciesFor([id])).get(id) ?? [] };
  }

  public async delete(workspaceId: string, id: string) {
    const db = this.connection.getConnection();
    await db.delete(sseEntities).where(and(eq(sseEntities.id, id), eq(sseEntities.workspaceId, workspaceId)));
    await db
      .delete(entityHistory)
      .where(and(eq(entityHistory.entityId, id), eq(entityHistory.workspaceId, workspaceId)));
    await this.dispatchUpdate(workspaceId);
    await this.tanxiumService.publishMessage('entity-history-updated', { workspaceId });
  }

  public listTree(workspaceId: string) {
    return this.entityGroupService.listTree({ workspaceId, entityType: 'sse' });
  }

  private async attachDependencies<T extends typeof sseEntities.$inferSelect>(entities: T[]) {
    const dependencies = await this.dependenciesFor(entities.map((entity) => entity.id));
    return entities.map((entity) => ({ ...entity, dependencies: dependencies.get(entity.id) ?? [] }));
  }

  private async dependenciesFor(ids: string[]) {
    const grouped = new Map<string, string[]>();
    if (!ids.length) return grouped;
    const rows = await this.connection
      .getConnection()
      .select()
      .from(sseEntityDependencies)
      .where(inArray(sseEntityDependencies.sseEntityId, ids));
    for (const row of rows) {
      const dependencies = grouped.get(row.sseEntityId) ?? [];
      dependencies.push(row.dependsOnId);
      grouped.set(row.sseEntityId, dependencies);
    }
    return grouped;
  }

  private async replaceDependencies(entityId: string, dependencies: string[]) {
    const database = this.connection.getConnection();
    await database.delete(sseEntityDependencies).where(eq(sseEntityDependencies.sseEntityId, entityId));
    if (dependencies.length) {
      await database
        .insert(sseEntityDependencies)
        .values([...new Set(dependencies)].sort().map((dependsOnId) => ({ sseEntityId: entityId, dependsOnId })));
    }
  }
}
