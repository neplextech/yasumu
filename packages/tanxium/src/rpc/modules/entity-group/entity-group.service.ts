import { Injectable } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import {
  EntityGroupCreateOptions,
  EntityGroupUpdateOptions,
  TreeViewOptions,
} from './types.ts';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { entityGroups, entityHistory, restEntities } from '../../../database/schema.ts';
import {
  NotFoundException,
  BadRequestException,
} from '../common/exceptions/http.exception.ts';
import { TanxiumService } from '../common/tanxium.service.ts';
import { EntityGroupData } from '@yasumu/common';

@Injectable()
export class EntityGroupService {
  public constructor(
    private readonly connection: TransactionalConnection,
    private readonly tanxiumService: TanxiumService,
  ) {}

  private async locateGroupWithCommonParent(
    name: string,
    workspaceId: string,
    parentId: string | null,
  ) {
    const db = this.connection.getConnection();
    const [result] = await db
      .select()
      .from(entityGroups)
      .where(
        and(
          eq(entityGroups.name, name),
          eq(entityGroups.workspaceId, workspaceId),
          parentId
            ? eq(entityGroups.parentId, parentId)
            : isNull(entityGroups.parentId),
        ),
      )
      .limit(1);
    return result ?? null;
  }

  private async dispatchUpdate(workspaceId: string) {
    await this.tanxiumService.publishMessage('rest-entity-updated', {
      workspaceId,
    });
  }

  public async create(workspaceId: string, data: EntityGroupCreateOptions) {
    const db = this.connection.getConnection();
    const maybeExisting = await this.locateGroupWithCommonParent(
      data.name,
      workspaceId,
      data.parentId,
    );

    if (maybeExisting) {
      return maybeExisting;
    }

    const [result] = await db
      .insert(entityGroups)
      .values({
        name: data.name,
        parentId: data.parentId,
        entityType: data.entityType,
        workspaceId,
      })
      .returning();

    await this.dispatchUpdate(workspaceId);
    return result;
  }

  public async get(workspaceId: string, id: string) {
    const db = this.connection.getConnection();
    const [result] = await db
      .select()
      .from(entityGroups)
      .where(
        and(eq(entityGroups.id, id), eq(entityGroups.workspaceId, workspaceId)),
      )
      .limit(1);

    if (!result) return null;

    const childGroups = await db
    .select()
    .from(entityGroups)
    .where(
      and(
        eq(entityGroups.parentId, id),
        eq(entityGroups.workspaceId, workspaceId),
      ),
    );

  // Fetch rest entities that belong to this group
  const entities = await db
    .select()
    .from(restEntities)
    .where(
      and(
        eq(restEntities.groupId, id),
        eq(restEntities.workspaceId, workspaceId),
      ),
    );

    return {
      ...result,
      children: childGroups,
      entities,
    };
  }

  public async getOrThrow(workspaceId: string, id: string) {
    const result = await this.get(workspaceId, id);
    if (!result) {
      throw new NotFoundException(
        `Entity group ${id} for workspace ${workspaceId} not found`,
      );
    }
    return result;
  }

  public async findAll(workspaceId: string) {
    const db = this.connection.getConnection();
    const result = await db
      .select()
      .from(entityGroups)
      .where(eq(entityGroups.workspaceId, workspaceId));

    return result;
  }

  public async update(
    workspaceId: string,
    id: string,
    data: EntityGroupUpdateOptions,
  ): Promise<EntityGroupData> {
    if (!data.name && !data.parentId) {
      throw new BadRequestException('At least one field is required');
    }

    const db = this.connection.getConnection();
    const entityGroup = await this.getOrThrow(workspaceId, id);

    const [updated] = await db
      .update(entityGroups)
      .set({
        name: data.name ?? entityGroup.name,
        parentId:
          data.parentId === undefined ? entityGroup.parentId : data.parentId,
      })
      .where(eq(entityGroups.id, id))
      .returning();

    await this.dispatchUpdate(workspaceId);

    return updated as unknown as EntityGroupData;
  }

  public async delete(workspaceId: string, id: string) {
    const db = this.connection.getConnection();
    const { entities } = await this.getOrThrow(workspaceId, id);

    await db.delete(entityGroups).where(eq(entityGroups.id, id)).returning();

    // Remove entity history only if there are entities to delete
    const entityIds = Array.from(new Set(entities.map((entity) => entity.id)));
    if (entityIds.length > 0) {
      await db
        .delete(entityHistory)
        .where(inArray(entityHistory.entityId, entityIds));
    }

    await this.dispatchUpdate(workspaceId);

    await this.tanxiumService.publishMessage('entity-history-updated', {
      workspaceId,
    });
  }

  public async listTree(options: TreeViewOptions) {
    // Returns a tree structure with folders (groups) and files (rest entities)
    // Each item has a `type` field: 'folder' or 'file'
    // Folders have a `children` array containing nested folders and files
    const { workspaceId, entityType } = options;
    const db = this.connection.getConnection();

    // Fetch all groups for this workspace and entity type
    const groups = await db
      .select()
      .from(entityGroups)
      .where(
        and(
          eq(entityGroups.workspaceId, workspaceId),
          eq(entityGroups.entityType, entityType),
        ),
      );

    // Fetch all rest entities for this workspace
    const entities = await db
      .select()
      .from(restEntities)
      .where(eq(restEntities.workspaceId, workspaceId));

    // Define tree item types for frontend consumption
    type GroupTreeItem = (typeof groups)[number] & {
      type: 'folder';
      children: TreeItem[];
    };

    type EntityTreeItem = (typeof entities)[number] & {
      type: 'file';
    };

    type TreeItem = GroupTreeItem | EntityTreeItem;

    // Map groups to include type and children array
    const mappedGroups: GroupTreeItem[] = groups.map((group) => ({
      ...group,
      type: 'folder' as const,
      children: [] as TreeItem[],
    }));

    // Map entities to include type
    const mappedEntities: EntityTreeItem[] = entities.map((entity) => ({
      ...entity,
      type: 'file' as const,
    }));

    // Create a map for quick group lookup
    const groupMap = new Map<string, GroupTreeItem>();
    for (const group of mappedGroups) {
      groupMap.set(group.id, group);
    }

    const root: TreeItem[] = [];

    // Build group hierarchy (nested folders)
    for (const group of mappedGroups) {
      if (group.parentId && groupMap.has(group.parentId)) {
        groupMap.get(group.parentId)!.children.push(group);
      } else {
        root.push(group);
      }
    }

    // Place entities in their respective groups or root
    for (const entity of mappedEntities) {
      if (entity.groupId && groupMap.has(entity.groupId)) {
        groupMap.get(entity.groupId)!.children.push(entity);
      } else {
        root.push(entity);
      }
    }

    // Sort function: folders first, then alphabetically by name
    const sortFn = (a: TreeItem, b: TreeItem) => {
      // Folders come before files
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      // Same type: sort alphabetically by name
      return a.name.localeCompare(b.name);
    };

    // Recursively sort all levels of the tree
    const sortRecursive = (items: TreeItem[]) => {
      items.sort(sortFn);
      for (const item of items) {
        if (item.type === 'folder') {
          sortRecursive(item.children);
        }
      }
    };

    sortRecursive(root);

    return root;
  }
}
