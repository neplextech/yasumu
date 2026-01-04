import { Injectable } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import type {
  EntityHistoryCreateOptions,
  EntityHistoryListOptions,
} from './types.ts';
import { and, desc, eq } from 'drizzle-orm';
import { entityHistory } from '../../../database/schema.ts';
import { NotFoundException } from '../common/exceptions/http.exception.ts';

@Injectable()
export class EntityHistoryService {
  public constructor(private readonly connection: TransactionalConnection) {}

  /**
   * Create or update a history entry for an entity.
   * If the entity already exists in history, it updates the timestamp.
   */
  public async upsert(workspaceId: string, data: EntityHistoryCreateOptions) {
    const db = this.connection.getConnection();

    // Check if entry already exists
    const [existing] = await db
      .select()
      .from(entityHistory)
      .where(
        and(
          eq(entityHistory.workspaceId, workspaceId),
          eq(entityHistory.entityId, data.entityId),
          eq(entityHistory.entityType, data.entityType),
        ),
      )
      .limit(1);

    if (existing) {
      // Update the existing entry (this will update the updatedAt timestamp)
      const [updated] = await db
        .update(entityHistory)
        .set({
          // Trigger updatedAt update by setting a value
          entityType: data.entityType,
        })
        .where(eq(entityHistory.id, existing.id))
        .returning();

      return updated;
    }

    // Create new entry
    const [result] = await db
      .insert(entityHistory)
      .values({
        workspaceId,
        entityId: data.entityId,
        entityType: data.entityType,
      })
      .returning();

    return result;
  }

  /**
   * Get a single history entry by ID.
   */
  public async get(workspaceId: string, id: string) {
    const db = this.connection.getConnection();

    const [result] = await db
      .select()
      .from(entityHistory)
      .where(
        and(
          eq(entityHistory.id, id),
          eq(entityHistory.workspaceId, workspaceId),
        ),
      )
      .limit(1);

    if (!result) return null;

    return result;
  }

  /**
   * Get a history entry or throw if not found.
   */
  public async getOrThrow(workspaceId: string, id: string) {
    const result = await this.get(workspaceId, id);
    if (!result) {
      throw new NotFoundException(
        `Entity history ${id} for workspace ${workspaceId} not found`,
      );
    }
    return result;
  }

  /**
   * List all history entries for a workspace, optionally filtered by entity type.
   * Returns entries sorted by most recently accessed first.
   */
  public async list(
    workspaceId: string,
    options: EntityHistoryListOptions = {},
  ) {
    const db = this.connection.getConnection();
    const { entityType, limit = 50 } = options;

    const conditions = [eq(entityHistory.workspaceId, workspaceId)];

    if (entityType) {
      conditions.push(eq(entityHistory.entityType, entityType));
    }

    const result = await db
      .select()
      .from(entityHistory)
      .where(and(...conditions))
      .orderBy(desc(entityHistory.updatedAt))
      .limit(limit);

    return result;
  }

  /**
   * Delete a specific history entry.
   */
  public async delete(workspaceId: string, id: string) {
    const db = this.connection.getConnection();
    await this.getOrThrow(workspaceId, id);

    await db.delete(entityHistory).where(eq(entityHistory.id, id));
  }

  /**
   * Delete a history entry by entity ID (when the entity itself is deleted).
   */
  public async deleteByEntityId(workspaceId: string, entityId: string) {
    const db = this.connection.getConnection();

    await db
      .delete(entityHistory)
      .where(
        and(
          eq(entityHistory.workspaceId, workspaceId),
          eq(entityHistory.entityId, entityId),
        ),
      );
  }

  /**
   * Clear all history for a workspace, optionally filtered by entity type.
   */
  public async clear(workspaceId: string, entityType?: string) {
    const db = this.connection.getConnection();

    const conditions = [eq(entityHistory.workspaceId, workspaceId)];

    if (entityType) {
      conditions.push(
        eq(
          entityHistory.entityType,
          entityType as 'rest' | 'graphql' | 'websocket' | 'socketio' | 'sse',
        ),
      );
    }

    await db.delete(entityHistory).where(and(...conditions));
  }
}
