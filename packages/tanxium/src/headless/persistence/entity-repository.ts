import type { EntityRepository, ExecutableEntity } from '@yasumu/headless';
import { YasumuError, YasumuErrorCodes } from '@yasumu/headless';
import { and, eq, inArray } from 'drizzle-orm';

import {
  entityGroups,
  graphqlEntities,
  graphqlEntityDependencies,
  restEntities,
  restEntityDependencies,
  sseEntities,
  sseEntityDependencies,
  workspaces,
} from '../../database/schema.ts';
import type { HeadlessDrizzleConnection, HeadlessDrizzleDatabase } from './database.ts';
import {
  mapGraphqlEntity,
  mapRestEntity,
  mapSseEntity,
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
    const referenced =
      existing.kind === 'rest'
        ? this.database
            .select()
            .from(restEntityDependencies)
            .where(eq(restEntityDependencies.dependsOnId, entityId))
            .all()
        : existing.kind === 'graphql'
          ? this.database
              .select()
              .from(graphqlEntityDependencies)
              .where(eq(graphqlEntityDependencies.dependsOnId, entityId))
              .all()
          : this.database
              .select()
              .from(sseEntityDependencies)
              .where(eq(sseEntityDependencies.dependsOnId, entityId))
              .all();
    if (referenced.length > 0) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Entity ${entityId} is still referenced`, {
        workspaceId,
        entityId,
      });
    }
    if (existing.kind === 'rest')
      this.database
        .delete(restEntities)
        .where(and(eq(restEntities.workspaceId, workspaceId), eq(restEntities.id, entityId)))
        .run();
    else if (existing.kind === 'graphql')
      this.database
        .delete(graphqlEntities)
        .where(and(eq(graphqlEntities.workspaceId, workspaceId), eq(graphqlEntities.id, entityId)))
        .run();
    else
      this.database
        .delete(sseEntities)
        .where(and(eq(sseEntities.workspaceId, workspaceId), eq(sseEntities.id, entityId)))
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
  if (graphql) return { kind: 'graphql', workspaceId: graphql.workspaceId };
  const sse = connection
    .select({ workspaceId: sseEntities.workspaceId })
    .from(sseEntities)
    .where(eq(sseEntities.id, entityId))
    .get();
  return sse ? { kind: 'sse', workspaceId: sse.workspaceId } : null;
}

export function loadEntities(connection: HeadlessDrizzleConnection, workspaceId: string): ExecutableEntity[] {
  const revisions = sourceMap(loadSourceRevisions(connection, workspaceId));
  const restRows = connection.select().from(restEntities).where(eq(restEntities.workspaceId, workspaceId)).all();
  const graphqlRows = connection
    .select()
    .from(graphqlEntities)
    .where(eq(graphqlEntities.workspaceId, workspaceId))
    .all();
  const sseRows = connection.select().from(sseEntities).where(eq(sseEntities.workspaceId, workspaceId)).all();
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
  const sseDependencies = dependenciesByEntity(
    connection,
    sseEntityDependencies,
    sseEntityDependencies.sseEntityId,
    sseRows.map((row) => row.id),
  );

  return [
    ...restRows.map((row) =>
      mapRestEntity(row, restDependencies.get(row.id) ?? [], revisions.get(sourceKey('rest', row.id))),
    ),
    ...graphqlRows.map((row) =>
      mapGraphqlEntity(row, graphqlDependencies.get(row.id) ?? [], revisions.get(sourceKey('graphql', row.id))),
    ),
    ...sseRows.map((row) =>
      mapSseEntity(row, sseDependencies.get(row.id) ?? [], revisions.get(sourceKey('sse', row.id))),
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
  if (entity.kind === 'graphql')
    connection
      .insert(graphqlEntities)
      .values({
        ...common,
        requestBody: storedGraphqlBody(entity),
        metadata: entity.metadata as unknown as typeof graphqlEntities.$inferInsert.metadata,
      })
      .run();
  else
    connection
      .insert(sseEntities)
      .values({
        ...common,
        method: entity.method,
        requestBody: storedRestBody(entity.body),
        eventTypes: entity.eventTypes,
        reconnect: entity.reconnect,
        metadata: entity.metadata as unknown as typeof sseEntities.$inferInsert.metadata,
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
  if (entity.kind === 'graphql')
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
  else
    connection
      .insert(sseEntities)
      .values({
        ...common,
        method: entity.method,
        requestBody: storedRestBody(entity.body),
        eventTypes: entity.eventTypes,
        reconnect: entity.reconnect,
        metadata: entity.metadata as unknown as typeof sseEntities.$inferInsert.metadata,
      })
      .onConflictDoUpdate({
        target: sseEntities.id,
        set: {
          ...common,
          method: entity.method,
          requestBody: storedRestBody(entity.body),
          eventTypes: entity.eventTypes,
          reconnect: entity.reconnect,
          metadata: entity.metadata as unknown as typeof sseEntities.$inferInsert.metadata,
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
  if (entity.kind === 'graphql') {
    connection.delete(graphqlEntityDependencies).where(eq(graphqlEntityDependencies.graphqlEntityId, entity.id)).run();
    for (const dependency of [...entity.dependencies].sort())
      connection
        .insert(graphqlEntityDependencies)
        .values({ graphqlEntityId: entity.id, dependsOnId: dependency })
        .run();
  } else {
    connection.delete(sseEntityDependencies).where(eq(sseEntityDependencies.sseEntityId, entity.id)).run();
    for (const dependency of [...entity.dependencies].sort())
      connection.insert(sseEntityDependencies).values({ sseEntityId: entity.id, dependsOnId: dependency }).run();
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
  if (entity.kind === 'graphql')
    connection
      .update(graphqlEntities)
      .set({
        ...common,
        requestBody: storedGraphqlBody(entity),
        metadata: entity.metadata as unknown as typeof graphqlEntities.$inferInsert.metadata,
      })
      .where(and(eq(graphqlEntities.id, entity.id), eq(graphqlEntities.workspaceId, entity.workspaceId)))
      .run();
  else
    connection
      .update(sseEntities)
      .set({
        ...common,
        method: entity.method,
        requestBody: storedRestBody(entity.body),
        eventTypes: entity.eventTypes,
        reconnect: entity.reconnect,
        metadata: entity.metadata as unknown as typeof sseEntities.$inferInsert.metadata,
      })
      .where(and(eq(sseEntities.id, entity.id), eq(sseEntities.workspaceId, entity.workspaceId)))
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
  for (const dependency of entity.dependencies) {
    const referenced =
      entity.kind === 'rest'
        ? connection
            .select({ id: restEntities.id })
            .from(restEntities)
            .where(and(eq(restEntities.id, dependency), eq(restEntities.workspaceId, workspaceId)))
            .get()
        : entity.kind === 'graphql'
          ? connection
              .select({ id: graphqlEntities.id })
              .from(graphqlEntities)
              .where(and(eq(graphqlEntities.id, dependency), eq(graphqlEntities.workspaceId, workspaceId)))
              .get()
          : connection
              .select({ id: sseEntities.id })
              .from(sseEntities)
              .where(and(eq(sseEntities.id, dependency), eq(sseEntities.workspaceId, workspaceId)))
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
  table: typeof restEntityDependencies | typeof graphqlEntityDependencies | typeof sseEntityDependencies,
  entityColumn:
    | typeof restEntityDependencies.restEntityId
    | typeof graphqlEntityDependencies.graphqlEntityId
    | typeof sseEntityDependencies.sseEntityId,
  ids: string[],
): Map<string, string[]> {
  const dependencies = new Map<string, string[]>();
  if (ids.length === 0) return dependencies;
  const rows = connection.select().from(table).where(inArray(entityColumn, ids)).all();
  for (const row of rows) {
    const entityId =
      'restEntityId' in row ? row.restEntityId : 'graphqlEntityId' in row ? row.graphqlEntityId : row.sseEntityId;
    const values = dependencies.get(entityId) ?? [];
    values.push(row.dependsOnId);
    dependencies.set(entityId, values);
  }
  return dependencies;
}

function compareEntities(left: ExecutableEntity, right: ExecutableEntity): number {
  const rank = { rest: 0, graphql: 1, sse: 2 } as const;
  const kindDifference = rank[left.kind] - rank[right.kind];
  return kindDifference || left.id.localeCompare(right.id);
}
