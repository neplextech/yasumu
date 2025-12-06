import { Injectable } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import {
  EntityGroupCreateOptions,
  EntityGroupUpdateOptions,
  TreeViewOptions,
} from './types.ts';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { entityGroups } from '../../../database/schema.ts';
import { RestService } from '../rest/rest.service.ts';
import {
  NotFoundException,
  BadRequestException,
} from '../common/exceptions/http.exception.ts';
import { mapResult } from '../../../database/common/index.ts';

@Injectable()
export class EntityGroupService {
  public constructor(
    private readonly connection: TransactionalConnection,
    private readonly restService: RestService,
  ) {}

  private async locateGroupWithCommonParent(
    name: string,
    entityOwnerId: string,
    parentId: string | null,
  ) {
    const db = this.connection.getConnection();
    const result = await db.query.entityGroups.findFirst({
      where: and(
        eq(entityGroups.name, name),
        eq(entityGroups.entityOwnerId, entityOwnerId),
        parentId
          ? eq(entityGroups.parentId, parentId)
          : isNull(entityGroups.parentId),
      ),
    });
    return result;
  }

  public async create(workspaceId: string, data: EntityGroupCreateOptions) {
    const db = this.connection.getConnection();
    const restModule = await this.restService.findOneByWorkspaceId(workspaceId);

    if (!restModule) {
      throw new NotFoundException(
        `Rest module for workspace ${workspaceId} not found`,
      );
    }

    const maybeExisting = await this.locateGroupWithCommonParent(
      data.name,
      restModule.id,
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
        entityOwnerId: restModule.id,
      })
      .returning();

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

    const result = await db.query.entityGroups.findFirst({
      where: and(
        eq(entityGroups.id, id),
        eq(entityGroups.entityOwnerId, restModule.id),
      ),
    });

    if (!result) return null;

    return mapResult(result);
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
    const restModule = await this.restService.findOneByWorkspaceId(workspaceId);

    if (!restModule) {
      throw new NotFoundException(
        `Rest module for workspace ${workspaceId} not found`,
      );
    }

    const result = await db.query.entityGroups.findMany({
      where: inArray(entityGroups.entityOwnerId, [restModule.id]),
    });

    return mapResult(result);
  }

  public async update(
    workspaceId: string,
    id: string,
    data: EntityGroupUpdateOptions,
  ) {
    if (!data.name && !data.parentId) {
      throw new BadRequestException('At least one field is required');
    }

    const db = this.connection.getConnection();
    const restModule = await this.restService.findOneByWorkspaceId(workspaceId);

    if (!restModule) {
      throw new NotFoundException(
        `Rest module for workspace ${workspaceId} not found`,
      );
    }

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

    return mapResult(updated);
  }

  public async delete(workspaceId: string, id: string) {
    const db = this.connection.getConnection();
    const restModule = await this.restService.findOneByWorkspaceId(workspaceId);

    if (!restModule) {
      throw new NotFoundException(
        `Rest module for workspace ${workspaceId} not found`,
      );
    }

    const entityGroup = await this.getOrThrow(workspaceId, id);

    const [deleted] = await db
      .delete(entityGroups)
      .where(eq(entityGroups.id, id))
      .returning();

    return { success: deleted.id === entityGroup.id };
  }

  public async listTree(options: TreeViewOptions) {
    const { tableName, owner, entityField, workspaceId, groupId, entityType } =
      options;
    const db = this.connection.getConnection();
    const groupOwner = await this.restService.findOneOrCreate(workspaceId);

    const groups = await db.query.entityGroups.findMany({
      where: and(
        eq(entityGroups.entityOwnerId, owner.id),
        eq(entityGroups.entityType, entityType),
        groupId ? eq(entityGroups.id, groupId) : undefined,
      ),
    });

    const entities = await db.query[tableName].findMany({
      where: eq(entityField, groupOwner.id),
    });

    const _mappedGroups = mapResult(groups);
    const mappedEntities = mapResult(entities);

    type MappedGroup = (typeof _mappedGroups)[number];
    type MappedEntity = (typeof mappedEntities)[number];
    type TreeItem = MappedEntity | (MappedGroup & { children: TreeItem[] });

    const mappedGroups = _mappedGroups.map((group) => ({
      ...group,
      children: [] as TreeItem[],
    }));

    const groupMap = new Map<string, (typeof mappedGroups)[0]>();
    for (const group of mappedGroups) {
      groupMap.set(group.id, group);
    }

    const root: TreeItem[] = [];

    for (const group of mappedGroups) {
      if (group.parentId && groupMap.has(group.parentId)) {
        groupMap.get(group.parentId)!.children.push(group);
      } else {
        root.push(group);
      }
    }

    for (const entity of mappedEntities) {
      if (entity.groupId && groupMap.has(entity.groupId)) {
        groupMap.get(entity.groupId)!.children.push(entity);
      } else {
        root.push(entity);
      }
    }

    const sortFn = (a: TreeItem, b: TreeItem) => a.name.localeCompare(b.name);

    const sortRecursive = (items: TreeItem[]) => {
      items.sort(sortFn);
      for (const item of items) {
        if ('children' in item) {
          sortRecursive(item.children);
        }
      }
    };

    sortRecursive(root);

    return root;
  }
}
