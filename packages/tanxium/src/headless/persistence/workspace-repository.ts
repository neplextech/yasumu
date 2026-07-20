import type { WorkspaceGroup, WorkspaceRepository, YasumuWorkspace } from '@yasumu/headless';
import { validateUniqueEntityIds, YasumuError, YasumuErrorCodes } from '@yasumu/headless';
import { and, eq, inArray, notInArray } from 'drizzle-orm';

import {
  entityGroups,
  environments,
  graphqlEntities,
  restEntities,
  smtp,
  sseEntities,
  workspaces,
} from '../../database/schema.ts';
import type { WorkspaceMetadata } from '../../database/schema/tables/workspaces.ts';
import type { HeadlessDrizzleDatabase } from './database.ts';
import { loadEntities, replaceDependencies, upsertEntity } from './entity-repository.ts';
import {
  jsonRecord,
  mapEnvironment,
  mapGroup,
  mapOrigin,
  mapScript,
  mapSmtp,
  sourceKey,
  sourceMap,
  storedEnvironmentValues,
  storeScript,
} from './mappers.ts';
import { loadSourceRevisions } from './source-revisions.ts';

export class DrizzleWorkspaceRepository implements WorkspaceRepository {
  public constructor(private readonly database: HeadlessDrizzleDatabase) {}

  // Drizzle's Node SQLite driver is synchronous while the headless port is asynchronous.
  // deno-lint-ignore require-await
  public async get(workspaceId: string): Promise<YasumuWorkspace | null> {
    const workspace = this.database.select().from(workspaces).where(eq(workspaces.id, workspaceId)).get();
    if (!workspace) return null;

    const revisions = sourceMap(loadSourceRevisions(this.database, workspaceId));
    const origin = mapOrigin(revisions.get(sourceKey('workspace', workspaceId)));
    const groups = orderGroups(
      this.database
        .select()
        .from(entityGroups)
        .where(eq(entityGroups.workspaceId, workspaceId))
        .all()
        .map((row) => mapGroup(row, revisions.get(sourceKey('entity-group', row.id)))),
    );
    const workspaceEnvironments = this.database
      .select()
      .from(environments)
      .where(eq(environments.workspaceId, workspaceId))
      .all()
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((row) => mapEnvironment(row, revisions.get(sourceKey('environment', row.id))));
    const smtpRow = this.database.select().from(smtp).where(eq(smtp.workspaceId, workspaceId)).get();

    return {
      id: workspace.id,
      name: workspace.name,
      version: workspace.version,
      root: workspace.path || undefined,
      activeEnvironmentId: workspace.activeEnvironmentId,
      script: mapScript(workspace.script, `workspace:${workspace.id}`, origin),
      entities: loadEntities(this.database, workspaceId),
      groups,
      environments: workspaceEnvironments,
      smtp: smtpRow ? mapSmtp(smtpRow, revisions.get(sourceKey('smtp', smtpRow.id))) : undefined,
      metadata: jsonRecord(workspace.metadata),
      origin,
    };
  }

  /** Replaces the complete persisted aggregate without advancing source baselines. */
  // deno-lint-ignore require-await
  public async save(workspace: YasumuWorkspace): Promise<void> {
    validateWorkspace(workspace);
    assertAggregateOwnership(this.database, workspace);
    const path = workspace.root ?? '';
    const metadata = { ...workspace.metadata, path } as WorkspaceMetadata;
    const orderedGroups = orderGroups(workspace.groups);

    this.database.transaction((transaction) => {
      transaction
        .insert(workspaces)
        .values({
          id: workspace.id,
          name: workspace.name,
          version: workspace.version,
          path,
          activeEnvironmentId: null,
          script: storeScript(workspace.script),
          metadata,
        })
        .onConflictDoUpdate({
          target: workspaces.id,
          set: {
            name: workspace.name,
            version: workspace.version,
            path,
            script: storeScript(workspace.script),
            metadata,
            updatedAt: Date.now(),
          },
        })
        .run();

      for (const group of orderedGroups) {
        transaction
          .insert(entityGroups)
          .values({
            id: group.id,
            workspaceId: workspace.id,
            name: group.name,
            parentId: group.parentId,
            entityType: group.entityKind,
            script: storeScript(group.script),
          })
          .onConflictDoUpdate({
            target: entityGroups.id,
            set: {
              name: group.name,
              parentId: group.parentId,
              entityType: group.entityKind,
              script: storeScript(group.script),
              updatedAt: Date.now(),
            },
          })
          .run();
      }

      for (const entity of workspace.entities) {
        upsertEntity(transaction, entity);
      }
      for (const entity of workspace.entities) {
        replaceDependencies(transaction, entity);
      }

      for (const environment of workspace.environments) {
        const values = storedEnvironmentValues(environment);
        transaction
          .insert(environments)
          .values({
            id: environment.id,
            workspaceId: workspace.id,
            name: environment.name,
            ...values,
          })
          .onConflictDoUpdate({
            target: environments.id,
            set: { name: environment.name, ...values, updatedAt: Date.now() },
          })
          .run();
      }

      if (workspace.smtp) {
        transaction
          .insert(smtp)
          .values({
            id: workspace.smtp.id,
            workspaceId: workspace.id,
            port: workspace.smtp.port,
            username: workspace.smtp.username,
            password: workspace.smtp.password,
            script: storeScript(workspace.smtp.script),
          })
          .onConflictDoUpdate({
            target: smtp.id,
            set: {
              port: workspace.smtp.port,
              username: workspace.smtp.username,
              password: workspace.smtp.password,
              script: storeScript(workspace.smtp.script),
              updatedAt: Date.now(),
            },
          })
          .run();
      }

      transaction
        .update(workspaces)
        .set({ activeEnvironmentId: workspace.activeEnvironmentId ?? null })
        .where(eq(workspaces.id, workspace.id))
        .run();

      const restIds = workspace.entities.filter((entity) => entity.kind === 'rest').map((entity) => entity.id);
      const graphqlIds = workspace.entities.filter((entity) => entity.kind === 'graphql').map((entity) => entity.id);
      const sseIds = workspace.entities.filter((entity) => entity.kind === 'sse').map((entity) => entity.id);
      const environmentIds = workspace.environments.map((environment) => environment.id);
      const groupIds = workspace.groups.map((group) => group.id);

      transaction
        .delete(restEntities)
        .where(
          restIds.length
            ? and(eq(restEntities.workspaceId, workspace.id), notInArray(restEntities.id, restIds))
            : eq(restEntities.workspaceId, workspace.id),
        )
        .run();
      transaction
        .delete(graphqlEntities)
        .where(
          graphqlIds.length
            ? and(eq(graphqlEntities.workspaceId, workspace.id), notInArray(graphqlEntities.id, graphqlIds))
            : eq(graphqlEntities.workspaceId, workspace.id),
        )
        .run();
      transaction
        .delete(sseEntities)
        .where(
          sseIds.length
            ? and(eq(sseEntities.workspaceId, workspace.id), notInArray(sseEntities.id, sseIds))
            : eq(sseEntities.workspaceId, workspace.id),
        )
        .run();
      transaction
        .delete(environments)
        .where(
          environmentIds.length
            ? and(eq(environments.workspaceId, workspace.id), notInArray(environments.id, environmentIds))
            : eq(environments.workspaceId, workspace.id),
        )
        .run();
      transaction
        .delete(entityGroups)
        .where(
          groupIds.length
            ? and(eq(entityGroups.workspaceId, workspace.id), notInArray(entityGroups.id, groupIds))
            : eq(entityGroups.workspaceId, workspace.id),
        )
        .run();
      if (!workspace.smtp) {
        transaction.delete(smtp).where(eq(smtp.workspaceId, workspace.id)).run();
      }
    });
  }
}

function assertAggregateOwnership(database: HeadlessDrizzleDatabase, workspace: YasumuWorkspace): void {
  const groupIds = workspace.groups.map((group) => group.id);
  if (groupIds.length > 0) {
    const foreignGroup = database
      .select()
      .from(entityGroups)
      .where(inArray(entityGroups.id, groupIds))
      .all()
      .find((group) => group.workspaceId !== workspace.id);
    if (foreignGroup) ownershipError(workspace.id, 'Group', foreignGroup.id);
  }

  const allEntityIds = workspace.entities.map((entity) => entity.id);
  if (allEntityIds.length > 0) {
    const storedRest = database.select().from(restEntities).where(inArray(restEntities.id, allEntityIds)).all();
    const storedGraphql = database
      .select()
      .from(graphqlEntities)
      .where(inArray(graphqlEntities.id, allEntityIds))
      .all();
    const storedSse = database.select().from(sseEntities).where(inArray(sseEntities.id, allEntityIds)).all();
    const conflict = [
      ...storedRest.map((entity) => ({ ...entity, kind: 'rest' as const })),
      ...storedGraphql.map((entity) => ({
        ...entity,
        kind: 'graphql' as const,
      })),
      ...storedSse.map((entity) => ({ ...entity, kind: 'sse' as const })),
    ].find((stored) => {
      const incoming = workspace.entities.find((entity) => entity.id === stored.id);
      return stored.workspaceId !== workspace.id || incoming?.kind !== stored.kind;
    });
    if (conflict) ownershipError(workspace.id, 'Entity', conflict.id);
  }

  const environmentIds = workspace.environments.map((environment) => environment.id);
  if (environmentIds.length > 0) {
    const foreignEnvironment = database
      .select()
      .from(environments)
      .where(inArray(environments.id, environmentIds))
      .all()
      .find((environment) => environment.workspaceId !== workspace.id);
    if (foreignEnvironment) {
      ownershipError(workspace.id, 'Environment', foreignEnvironment.id);
    }
  }

  if (workspace.smtp) {
    const existing = database.select().from(smtp).where(eq(smtp.id, workspace.smtp.id)).get();
    if (existing && existing.workspaceId !== workspace.id) {
      ownershipError(workspace.id, 'SMTP', existing.id);
    }
  }
}

function ownershipError(workspaceId: string, kind: string, id: string): never {
  throw new YasumuError(YasumuErrorCodes.InvalidReference, `${kind} ID belongs to another workspace: ${id}`, {
    workspaceId,
  });
}

function validateWorkspace(workspace: YasumuWorkspace): void {
  validateUniqueEntityIds(workspace.entities);
  const groups = new Map(workspace.groups.map((group) => [group.id, group]));
  if (groups.size !== workspace.groups.length) {
    throw new YasumuError(YasumuErrorCodes.DuplicateEntityId, 'Duplicate group ID', {
      workspaceId: workspace.id,
    });
  }
  for (const group of workspace.groups) {
    if (group.workspaceId !== workspace.id || (group.parentId && !groups.has(group.parentId))) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Invalid group reference: ${group.id}`, {
        workspaceId: workspace.id,
      });
    }
  }
  const entities = new Map(workspace.entities.map((entity) => [entity.id, entity]));
  for (const entity of workspace.entities) {
    if (entity.workspaceId !== workspace.id) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Entity ${entity.id} belongs to another workspace`, {
        workspaceId: workspace.id,
        entityId: entity.id,
      });
    }
    if (entity.groupId && groups.get(entity.groupId)?.entityKind !== entity.kind) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Invalid group for entity ${entity.id}`, {
        workspaceId: workspace.id,
        entityId: entity.id,
      });
    }
    for (const dependency of entity.dependencies) {
      if (entities.get(dependency)?.kind !== entity.kind) {
        throw new YasumuError(YasumuErrorCodes.InvalidReference, `Invalid same-kind dependency: ${dependency}`, {
          workspaceId: workspace.id,
          entityId: entity.id,
        });
      }
    }
  }
  if (
    workspace.activeEnvironmentId &&
    !workspace.environments.some((environment) => environment.id === workspace.activeEnvironmentId)
  ) {
    throw new YasumuError(
      YasumuErrorCodes.InvalidReference,
      `Active environment not found: ${workspace.activeEnvironmentId}`,
      { workspaceId: workspace.id },
    );
  }
}

function orderGroups(groups: WorkspaceGroup[]): WorkspaceGroup[] {
  const byId = new Map(groups.map((group) => [group.id, group]));
  const state = new Map<string, 'visiting' | 'visited'>();
  const ordered: WorkspaceGroup[] = [];

  const visit = (group: WorkspaceGroup) => {
    const current = state.get(group.id);
    if (current === 'visited') return;
    if (current === 'visiting') {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Group cycle detected at ${group.id}`);
    }
    state.set(group.id, 'visiting');
    if (group.parentId) visit(byId.get(group.parentId)!);
    state.set(group.id, 'visited');
    ordered.push(group);
  };

  for (const group of [...groups].sort((left, right) => left.id.localeCompare(right.id))) visit(group);
  return ordered;
}
