import type { EntityRepository, ExecutableEntity } from '@yasumu/headless';
import { YasumuError, YasumuErrorCodes } from '@yasumu/headless';
import { and, eq, inArray } from 'drizzle-orm';

import {
  entityGroups,
  graphqlEntities,
  graphqlEntityDependencies,
  restEntities,
  restEntityDependencies,
  workspaces,
} from '../../database/schema.ts';
import type { HeadlessDrizzleConnection, HeadlessDrizzleDatabase } from './database.ts';
import {
  mapGraphqlEntity,
  mapRestEntity,
  sourceKey,
  sourceMap,
  storedEntity,
  storedGraphqlBody,
  storedRestBody,
} from './mappers.ts';
import { loadSourceRevisions } from './source-revisions.ts';

export class DrizzleEntityRepository implements EntityRepository {
  public constructor(private readonly database: HeadlessDrizzleDatabase) {}

  // Drizzle's Node SQLite driver is synchronous while the headless port is asynchronous.
  // deno-lint-ignore require-await
  public async get(workspaceId: string, entityId: string): Promise<ExecutableEntity | null> {
    return loadEntities(this.database, workspaceId).find((entity) => entity.id === entityId) ?? null;
  }

  // deno-lint-ignore require-await
  public async list(workspaceId: string, kind?: ExecutableEntity['kind']): Promise<ExecutableEntity[]> {
    const entities = loadEntities(this.database, workspaceId);
    return kind ? entities.filter((entity) => entity.kind === kind) : entities;
  }

  public async create(workspaceId: string, entity: ExecutableEntity): Promise<ExecutableEntity> {
    assertWorkspace(this.database, workspaceId);
    if (findStoredEntity(this.database, entity.id)) {
      throw new YasumuError(YasumuErrorCodes.DuplicateEntityId, `Entity ID already exists: ${entity.id}`, {
        workspaceId,
        entityId: entity.id,
      });
    }
    assertEntityReferences(this.database, workspaceId, entity);

    this.database.transaction((transaction) => {
      insertEntity(transaction, entity);
      replaceDependencies(transaction, entity);
    });
    return (await this.get(workspaceId, entity.id))!;
  }

  public async update(workspaceId: string, entityId: string, entity: ExecutableEntity): Promise<ExecutableEntity> {
    if (entity.id !== entityId) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, 'Entity IDs are immutable', {
        workspaceId,
        entityId,
      });
    }
    const existing = await this.get(workspaceId, entityId);
    if (!existing) {
      throw new YasumuError(YasumuErrorCodes.EntityNotFound, `Entity not found: ${entityId}`, {
        workspaceId,
        entityId,
      });
    }
    if (existing.kind !== entity.kind) {
      throw new YasumuError(YasumuErrorCodes.InvalidEntity, 'Entity kind cannot be changed', {
        workspaceId,
        entityId,
      });
    }
    assertEntityReferences(this.database, workspaceId, entity);

    this.database.transaction((transaction) => {
      updateEntity(transaction, entity);
      replaceDependencies(transaction, entity);
    });
    return (await this.get(workspaceId, entityId))!;
  }

  public async delete(workspaceId: string, entityId: string): Promise<void> {
    const existing = await this.get(workspaceId, entityId);
    if (!existing) return;
    const dependencyTable = existing.kind === 'rest' ? restEntityDependencies : graphqlEntityDependencies;
    const dependsOnColumn =
      existing.kind === 'rest' ? restEntityDependencies.dependsOnId : graphqlEntityDependencies.dependsOnId;
    if (this.database.select().from(dependencyTable).where(eq(dependsOnColumn, entityId)).all().length > 0) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Entity ${entityId} is still referenced`, {
        workspaceId,
        entityId,
      });
    }
    const table = existing.kind === 'rest' ? restEntities : graphqlEntities;
    this.database
      .delete(table)
      .where(and(eq(table.workspaceId, workspaceId), eq(table.id, entityId)))
      .run();
  }
}

function findStoredEntity(
  connection: HeadlessDrizzleConnection,
  entityId: string,
): { kind: ExecutableEntity['kind']; workspaceId: string } | null {
  const rest = connection
    .select({ workspaceId: restEntities.workspaceId })
    .from(restEntities)
    .where(eq(restEntities.id, entityId))
    .get();
  if (rest) return { kind: 'rest', workspaceId: rest.workspaceId };
  const graphql = connection
    .select({ workspaceId: graphqlEntities.workspaceId })
    .from(graphqlEntities)
    .where(eq(graphqlEntities.id, entityId))
    .get();
  return graphql ? { kind: 'graphql', workspaceId: graphql.workspaceId } : null;
}

export function loadEntities(connection: HeadlessDrizzleConnection, workspaceId: string): ExecutableEntity[] {
  const revisions = sourceMap(loadSourceRevisions(connection, workspaceId));
  const restRows = connection.select().from(restEntities).where(eq(restEntities.workspaceId, workspaceId)).all();
  const graphqlRows = connection
    .select()
    .from(graphqlEntities)
    .where(eq(graphqlEntities.workspaceId, workspaceId))
    .all();
  const restDependencies = dependenciesByEntity(
    connection,
    restEntityDependencies,
    restEntityDependencies.restEntityId,
    restRows.map((row) => row.id),
  );
  const graphqlDependencies = dependenciesByEntity(
    connection,
    graphqlEntityDependencies,
    graphqlEntityDependencies.graphqlEntityId,
    graphqlRows.map((row) => row.id),
  );

  return [
    ...restRows.map((row) =>
      mapRestEntity(row, restDependencies.get(row.id) ?? [], revisions.get(sourceKey('rest', row.id))),
    ),
    ...graphqlRows.map((row) =>
      mapGraphqlEntity(row, graphqlDependencies.get(row.id) ?? [], revisions.get(sourceKey('graphql', row.id))),
    ),
  ].sort(compareEntities);
}

export function insertEntity(connection: HeadlessDrizzleConnection, entity: ExecutableEntity): void {
  const common = storedEntity(entity);
  if (entity.kind === 'rest') {
    connection
      .insert(restEntities)
      .values({
        ...common,
        method: entity.method,
        requestBody: storedRestBody(entity.body),
        metadata: entity.metadata as unknown as typeof restEntities.$inferInsert.metadata,
      })
      .run();
    return;
  }
  connection
    .insert(graphqlEntities)
    .values({
      ...common,
      requestBody: storedGraphqlBody(entity),
      metadata: entity.metadata as unknown as typeof graphqlEntities.$inferInsert.metadata,
    })
    .run();
}

export function upsertEntity(connection: HeadlessDrizzleConnection, entity: ExecutableEntity): void {
  const common = storedEntity(entity);
  const updatedAt = Date.now();
  if (entity.kind === 'rest') {
    connection
      .insert(restEntities)
      .values({
        ...common,
        method: entity.method,
        requestBody: storedRestBody(entity.body),
        metadata: entity.metadata as unknown as typeof restEntities.$inferInsert.metadata,
      })
      .onConflictDoUpdate({
        target: restEntities.id,
        set: {
          ...common,
          method: entity.method,
          requestBody: storedRestBody(entity.body),
          metadata: entity.metadata as unknown as typeof restEntities.$inferInsert.metadata,
          updatedAt,
        },
      })
      .run();
    return;
  }
  connection
    .insert(graphqlEntities)
    .values({
      ...common,
      requestBody: storedGraphqlBody(entity),
      metadata: entity.metadata as unknown as typeof graphqlEntities.$inferInsert.metadata,
    })
    .onConflictDoUpdate({
      target: graphqlEntities.id,
      set: {
        ...common,
        requestBody: storedGraphqlBody(entity),
        metadata: entity.metadata as unknown as typeof graphqlEntities.$inferInsert.metadata,
        updatedAt,
      },
    })
    .run();
}

export function replaceDependencies(connection: HeadlessDrizzleConnection, entity: ExecutableEntity): void {
  if (entity.kind === 'rest') {
    connection.delete(restEntityDependencies).where(eq(restEntityDependencies.restEntityId, entity.id)).run();
    for (const dependency of [...entity.dependencies].sort()) {
      connection.insert(restEntityDependencies).values({ restEntityId: entity.id, dependsOnId: dependency }).run();
    }
    return;
  }
  connection.delete(graphqlEntityDependencies).where(eq(graphqlEntityDependencies.graphqlEntityId, entity.id)).run();
  for (const dependency of [...entity.dependencies].sort()) {
    connection.insert(graphqlEntityDependencies).values({ graphqlEntityId: entity.id, dependsOnId: dependency }).run();
  }
}

function updateEntity(connection: HeadlessDrizzleConnection, entity: ExecutableEntity): void {
  const common = storedEntity(entity);
  if (entity.kind === 'rest') {
    connection
      .update(restEntities)
      .set({
        ...common,
        method: entity.method,
        requestBody: storedRestBody(entity.body),
        metadata: entity.metadata as unknown as typeof restEntities.$inferInsert.metadata,
      })
      .where(and(eq(restEntities.id, entity.id), eq(restEntities.workspaceId, entity.workspaceId)))
      .run();
    return;
  }
  connection
    .update(graphqlEntities)
    .set({
      ...common,
      requestBody: storedGraphqlBody(entity),
      metadata: entity.metadata as unknown as typeof graphqlEntities.$inferInsert.metadata,
    })
    .where(and(eq(graphqlEntities.id, entity.id), eq(graphqlEntities.workspaceId, entity.workspaceId)))
    .run();
}

function assertWorkspace(connection: HeadlessDrizzleConnection, workspaceId: string): void {
  if (!connection.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.id, workspaceId)).get()) {
    throw new YasumuError(YasumuErrorCodes.WorkspaceNotFound, `Workspace not found: ${workspaceId}`, {
      workspaceId,
    });
  }
}

function assertEntityReferences(
  connection: HeadlessDrizzleConnection,
  workspaceId: string,
  entity: ExecutableEntity,
): void {
  if (entity.workspaceId !== workspaceId) {
    throw new YasumuError(YasumuErrorCodes.InvalidReference, `Entity ${entity.id} belongs to another workspace`, {
      workspaceId,
      entityId: entity.id,
    });
  }
  if (entity.groupId) {
    const group = connection
      .select()
      .from(entityGroups)
      .where(and(eq(entityGroups.id, entity.groupId), eq(entityGroups.workspaceId, workspaceId)))
      .get();
    if (!group || group.entityType !== entity.kind) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Unknown ${entity.kind} group: ${entity.groupId}`, {
        workspaceId,
        entityId: entity.id,
      });
    }
  }
  const table = entity.kind === 'rest' ? restEntities : graphqlEntities;
  for (const dependency of entity.dependencies) {
    const referenced = connection
      .select({ id: table.id })
      .from(table)
      .where(and(eq(table.id, dependency), eq(table.workspaceId, workspaceId)))
      .get();
    if (!referenced) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Unknown same-kind entity dependency: ${dependency}`, {
        workspaceId,
        entityId: entity.id,
      });
    }
  }
}

function dependenciesByEntity(
  connection: HeadlessDrizzleConnection,
  table: typeof restEntityDependencies | typeof graphqlEntityDependencies,
  entityColumn: typeof restEntityDependencies.restEntityId | typeof graphqlEntityDependencies.graphqlEntityId,
  ids: string[],
): Map<string, string[]> {
  const dependencies = new Map<string, string[]>();
  if (ids.length === 0) return dependencies;
  const rows = connection.select().from(table).where(inArray(entityColumn, ids)).all();
  for (const row of rows) {
    const entityId = 'restEntityId' in row ? row.restEntityId : row.graphqlEntityId;
    const values = dependencies.get(entityId) ?? [];
    values.push(row.dependsOnId);
    dependencies.set(entityId, values);
  }
  return dependencies;
}

function compareEntities(left: ExecutableEntity, right: ExecutableEntity): number {
  const kindDifference = (left.kind === 'rest' ? 0 : 1) - (right.kind === 'rest' ? 0 : 1);
  return kindDifference || left.id.localeCompare(right.id);
}
