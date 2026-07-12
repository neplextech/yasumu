import { join } from 'node:path';

import { WorkspaceData, YasumuScriptingLanguage } from '@yasumu/common';
import { Injectable } from '@yasumu/den';
import { Infer } from '@yasumu/schema';
import {
  ConflictResolver,
  EnvironmentSchema,
  GraphqlSchema,
  LockFileService,
  RestSchema,
  SmtpSchema,
  SyncAction,
  SyncEntityState,
  WorkspaceSchema,
  YasumuAnnotations,
  YslService,
} from '@yasumu/sync';
import { and, eq } from 'drizzle-orm';

import { entityGroups, environments, graphqlEntities, restEntities, smtp, workspaces } from '@/database/schema.ts';

import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { EmailService } from '../email/email.service.ts';
import { EntityGroupService } from '../entity-group/entity-group.service.ts';
import { EnvironmentsService } from '../environment/environment.service.ts';
import { GraphqlService } from '../graphql/graphql.service.ts';
import { RestService } from '../rest/rest.service.ts';
import { getWorkspacePath, listYslFiles, readYslFile, topologicalSortGroups } from './fs-helpers.ts';
import {
  serializeEnvironmentContent,
  serializeGraphqlContent,
  serializeRestContent,
  serializeSmtpContent,
  serializeWorkspaceContent,
} from './fs-serializers.ts';
import { SynchronizationPusher } from './synchronization-pusher.service.ts';

@Injectable()
export class SynchronizationLoader {
  public constructor(
    private readonly connection: TransactionalConnection,
    private readonly yslService: YslService,
    private readonly lockFileService: LockFileService,
    private readonly conflictResolver: ConflictResolver,
    private readonly entityGroupService: EntityGroupService,
    private readonly restService: RestService,
    private readonly graphqlService: GraphqlService,
    private readonly environmentsService: EnvironmentsService,
    private readonly emailService: EmailService,
    private readonly pusher: SynchronizationPusher,
  ) {}

  public async findWorkspace(id: string): Promise<WorkspaceData | null> {
    const db = this.connection.getConnection();
    const [result] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return result ?? null;
  }

  public async loadAll(workspace: WorkspaceData): Promise<void> {
    await this.loadWorkspaceFromFs(workspace);
    await this.loadRestEntitiesFromFs(workspace);
    await this.loadGraphqlEntitiesFromFs(workspace);
    await this.loadEnvironmentsFromFs(workspace);
    await this.loadSmtpFromFs(workspace);
  }

  public async createWorkspaceFromFs(workspacePath: string): Promise<WorkspaceData | null> {
    const workspaceFile = join(workspacePath, 'yasumu', 'workspace.ysl');
    const fileContent = await readYslFile(workspaceFile);

    if (!fileContent) return null;

    const parsed = this.yslService.deserialize(WorkspaceSchema, fileContent);
    const db = this.connection.getConnection();

    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        id: parsed.blocks.metadata.id,
        name: parsed.blocks.metadata.name,
        version: parsed.blocks.metadata.version,
        path: workspacePath,
        metadata: { path: workspacePath },
      })
      .returning();

    const groupEntries = Object.entries(parsed.blocks.groups);
    const sortedGroups = topologicalSortGroups(groupEntries);

    for (const [groupId, groupData] of sortedGroups) {
      await db.insert(entityGroups).values({
        id: groupId,
        name: groupData.name,
        parentId: groupData.parentId,
        workspaceId: newWorkspace.id,
        entityType: groupData.entity,
      });
    }

    await this.createRestEntitiesFromFs(newWorkspace);
    await this.createGraphqlEntitiesFromFs(newWorkspace);
    await this.createEnvironmentsFromFs(newWorkspace);
    await this.createSmtpFromFs(newWorkspace);

    await this.lockFileService.setEntry(
      workspacePath,
      'workspace',
      newWorkspace.id,
      this.lockFileService.computeHash(fileContent),
    );

    return newWorkspace;
  }

  private async createRestEntitiesFromFs(workspace: WorkspaceData): Promise<void> {
    const restDir = getWorkspacePath(workspace, 'rest');
    const files = await listYslFiles(restDir);
    const db = this.connection.getConnection();

    const existingGroups = await this.entityGroupService.findAll(workspace.id);
    const validGroupIds = new Set(existingGroups.map((g) => g.id));

    for (const filePath of files) {
      const fileContent = await readYslFile(filePath);
      if (!fileContent) continue;

      const parsed = this.yslService.deserialize(RestSchema, fileContent);
      const { metadata, request, script } = parsed.blocks;
      const groupId = metadata.groupId && validGroupIds.has(metadata.groupId) ? metadata.groupId : null;

      await db.insert(restEntities).values({
        id: metadata.id,
        workspaceId: workspace.id,
        name: metadata.name,
        method: metadata.method,
        url: request.url,
        groupId,
        requestHeaders: request.headers,
        requestParameters: request.parameters,
        searchParameters: request.searchParameters,
        requestBody: request.body
          ? {
              type: request.body.type as 'json' | 'text' | 'binary' | 'form-data' | 'x-www-form-urlencoded',
              value: request.body.content ?? '',
              metadata: {},
            }
          : null,
        script: script ? { language: YasumuScriptingLanguage.JavaScript, code: script } : null,
      });

      await this.lockFileService.setEntry(
        workspace.path,
        'rest',
        metadata.id,
        this.lockFileService.computeHash(fileContent),
      );
    }
  }

  private async createGraphqlEntitiesFromFs(workspace: WorkspaceData): Promise<void> {
    const graphqlDir = getWorkspacePath(workspace, 'graphql');
    const files = await listYslFiles(graphqlDir);
    const db = this.connection.getConnection();

    const existingGroups = await this.entityGroupService.findAll(workspace.id);
    const validGroupIds = new Set(existingGroups.map((g) => g.id));

    for (const filePath of files) {
      const fileContent = await readYslFile(filePath);
      if (!fileContent) continue;

      const parsed = this.yslService.deserialize(GraphqlSchema, fileContent);
      const { metadata, request, script } = parsed.blocks;
      const groupId = metadata.groupId && validGroupIds.has(metadata.groupId) ? metadata.groupId : null;

      await db.insert(graphqlEntities).values({
        id: metadata.id,
        workspaceId: workspace.id,
        name: metadata.name,
        url: request.url,
        groupId,
        requestHeaders: request.headers,
        requestParameters: request.parameters,
        searchParameters: request.searchParameters,
        requestBody: request.body
          ? {
              type: request.body.type as 'json' | 'text' | 'binary' | 'form-data' | 'x-www-form-urlencoded',
              value: request.body.content ?? '',
              metadata: {},
            }
          : null,
        script: script ? { language: YasumuScriptingLanguage.JavaScript, code: script } : null,
      });

      await this.lockFileService.setEntry(
        workspace.path,
        'graphql',
        metadata.id,
        this.lockFileService.computeHash(fileContent),
      );
    }
  }

  private async createEnvironmentsFromFs(workspace: WorkspaceData): Promise<void> {
    const envDir = getWorkspacePath(workspace, 'environment');
    const files = await listYslFiles(envDir);
    const db = this.connection.getConnection();

    for (const filePath of files) {
      const fileContent = await readYslFile(filePath);
      if (!fileContent) continue;

      const parsed = this.yslService.deserialize(EnvironmentSchema, fileContent);
      const { metadata, variables, secrets } = parsed.blocks;

      await db.insert(environments).values({
        id: metadata.id,
        workspaceId: workspace.id,
        name: metadata.name,
        variables,
        secrets: secrets.map((s) => ({
          key: s.key,
          value: '',
          enabled: s.enabled,
        })),
      });

      await this.lockFileService.setEntry(
        workspace.path,
        'environment',
        metadata.id,
        this.lockFileService.computeHash(fileContent),
      );
    }
  }

  private async createSmtpFromFs(workspace: WorkspaceData): Promise<void> {
    const smtpDir = getWorkspacePath(workspace, 'smtp');
    const smtpFile = join(smtpDir, 'smtp.ysl');
    const fileContent = await readYslFile(smtpFile);

    if (!fileContent) return;

    const parsed = this.yslService.deserialize(SmtpSchema, fileContent);
    const db = this.connection.getConnection();

    await db.insert(smtp).values({
      id: parsed.blocks.metadata.id,
      workspaceId: workspace.id,
      port: parsed.blocks.metadata.port,
      username: parsed.blocks.metadata.username,
      password: null,
      script: parsed.blocks.script
        ? { language: YasumuScriptingLanguage.JavaScript, code: parsed.blocks.script }
        : null,
    });

    await this.lockFileService.setEntry(
      workspace.path,
      'smtp',
      parsed.blocks.metadata.id,
      this.lockFileService.computeHash(fileContent),
    );
  }

  public async loadWorkspaceFromFs(workspace: WorkspaceData): Promise<void> {
    const workspaceDir = getWorkspacePath(workspace, 'workspace');
    const workspaceFile = join(workspaceDir, 'workspace.ysl');
    const fileContent = await readYslFile(workspaceFile);

    if (!fileContent) return;

    const dbContent = serializeWorkspaceContent(workspace);
    const { action, state } = await this.determineSyncAction(
      workspace.path,
      'workspace',
      workspace.id,
      dbContent,
      fileContent,
    );
    const resolvedAction = await this.resolveSyncAction(action, state);

    if (resolvedAction === 'none') return;

    if (resolvedAction === 'push') {
      await this.pusher.pushWorkspaceToFs(workspace);
      return;
    }

    if (resolvedAction === 'pull') {
      await this.applyWorkspaceFromYsl(workspace, fileContent);
    }

    await this.lockFileService.setEntry(
      workspace.path,
      'workspace',
      workspace.id,
      this.lockFileService.computeHash(fileContent),
    );
  }

  private async applyWorkspaceFromYsl(workspace: WorkspaceData, content: string): Promise<void> {
    const parsed = this.yslService.deserialize(WorkspaceSchema, content);
    const db = this.connection.getConnection();

    await db
      .update(workspaces)
      .set({
        name: parsed.blocks.metadata.name,
        version: parsed.blocks.metadata.version,
      })
      .where(eq(workspaces.id, workspace.id));

    const existingGroups = await this.entityGroupService.findAll(workspace.id);
    const existingGroupIds = new Set(existingGroups.map((g) => g.id));
    const parsedGroupIds = new Set(Object.keys(parsed.blocks.groups));

    const groupEntries = Object.entries(parsed.blocks.groups);
    const sortedGroups = topologicalSortGroups(groupEntries);

    for (const [groupId, groupData] of sortedGroups) {
      if (existingGroupIds.has(groupId)) {
        await db
          .update(entityGroups)
          .set({ name: groupData.name, parentId: groupData.parentId })
          .where(eq(entityGroups.id, groupId));
      } else {
        await db.insert(entityGroups).values({
          id: groupId,
          name: groupData.name,
          parentId: groupData.parentId,
          workspaceId: workspace.id,
          entityType: groupData.entity,
        });
      }
    }

    for (const existingGroup of existingGroups) {
      if (!parsedGroupIds.has(existingGroup.id)) {
        await db.delete(entityGroups).where(eq(entityGroups.id, existingGroup.id));
      }
    }
  }

  public async loadRestEntitiesFromFs(workspace: WorkspaceData): Promise<void> {
    const restDir = getWorkspacePath(workspace, 'rest');
    const files = await listYslFiles(restDir);
    const db = this.connection.getConnection();

    const existingEntities = await this.restService.list(workspace.id);
    const existingIds = new Set(existingEntities.map((e) => e.id));
    const processedIds = new Set<string>();

    const existingGroups = await this.entityGroupService.findAll(workspace.id);
    const validGroupIds = new Set(existingGroups.map((g) => g.id));

    for (const filePath of files) {
      const fileContent = await readYslFile(filePath);
      if (!fileContent) continue;

      const parsed = this.yslService.deserialize(RestSchema, fileContent);
      const entityId = parsed.blocks.metadata.id;
      processedIds.add(entityId);

      const existingEntity = existingEntities.find((e) => e.id === entityId);
      const dbContent = existingEntity ? serializeRestContent(existingEntity) : null;

      const { action, state } = await this.determineSyncAction(
        workspace.path,
        'rest',
        entityId,
        dbContent,
        fileContent,
      );
      const resolvedAction = await this.resolveSyncAction(action, state);

      if (resolvedAction === 'none') continue;

      if (resolvedAction === 'push') {
        if (existingEntity) {
          await this.pusher.pushRestEntityToFs(workspace, existingEntity);
        }
        continue;
      }

      if (resolvedAction === 'pull') {
        await this.applyRestEntityFromYsl(workspace.id, parsed, existingIds.has(entityId), validGroupIds);
      }

      await this.lockFileService.setEntry(
        workspace.path,
        'rest',
        entityId,
        this.lockFileService.computeHash(fileContent),
      );
    }

    for (const existingEntity of existingEntities) {
      if (!processedIds.has(existingEntity.id)) {
        const lockEntry = await this.lockFileService.getEntry(workspace.path, 'rest', existingEntity.id);

        if (lockEntry) {
          await db.delete(restEntities).where(eq(restEntities.id, existingEntity.id));
          await this.lockFileService.removeEntry(workspace.path, 'rest', existingEntity.id);
        }
      }
    }
  }

  private async applyRestEntityFromYsl(
    workspaceId: string,
    parsed: Infer<typeof RestSchema>,
    exists: boolean,
    validGroupIds: Set<string>,
  ): Promise<void> {
    const db = this.connection.getConnection();
    const { metadata, request, script, test } = parsed.blocks;
    const groupId = metadata.groupId && validGroupIds.has(metadata.groupId) ? metadata.groupId : null;

    const data = {
      name: metadata.name,
      method: metadata.method,
      url: request.url,
      groupId,
      requestHeaders: request.headers,
      requestParameters: request.parameters,
      searchParameters: request.searchParameters,
      requestBody: request.body
        ? {
            type: request.body.type as 'json' | 'text' | 'binary' | 'form-data' | 'x-www-form-urlencoded',
            value: request.body.content ?? '',
            metadata: {},
          }
        : null,
      script: script ? { language: YasumuScriptingLanguage.JavaScript, code: script } : null,
      testScript: test ? { language: YasumuScriptingLanguage.JavaScript, code: test } : null,
    };

    if (exists) {
      await db.update(restEntities).set(data).where(eq(restEntities.id, metadata.id));
    } else {
      await db.insert(restEntities).values({ id: metadata.id, workspaceId, ...data });
    }
  }

  public async loadGraphqlEntitiesFromFs(workspace: WorkspaceData): Promise<void> {
    const graphqlDir = getWorkspacePath(workspace, 'graphql');
    const files = await listYslFiles(graphqlDir);
    const db = this.connection.getConnection();

    const existingEntities = await this.graphqlService.list(workspace.id);
    const existingIds = new Set(existingEntities.map((e) => e.id));
    const processedIds = new Set<string>();

    const existingGroups = await this.entityGroupService.findAll(workspace.id);
    const validGroupIds = new Set(existingGroups.map((g) => g.id));

    for (const filePath of files) {
      const fileContent = await readYslFile(filePath);
      if (!fileContent) continue;

      const parsed = this.yslService.deserialize(GraphqlSchema, fileContent);
      const entityId = parsed.blocks.metadata.id;
      processedIds.add(entityId);

      const existingEntity = existingEntities.find((e) => e.id === entityId);
      const dbContent = existingEntity ? serializeGraphqlContent(existingEntity) : null;

      const { action, state } = await this.determineSyncAction(
        workspace.path,
        'graphql',
        entityId,
        dbContent,
        fileContent,
      );
      const resolvedAction = await this.resolveSyncAction(action, state);

      if (resolvedAction === 'none') continue;

      if (resolvedAction === 'push') {
        if (existingEntity) {
          await this.pusher.pushGraphqlEntityToFs(workspace, existingEntity);
        }
        continue;
      }

      if (resolvedAction === 'pull') {
        await this.applyGraphqlEntityFromYsl(workspace.id, parsed, existingIds.has(entityId), validGroupIds);
      }

      await this.lockFileService.setEntry(
        workspace.path,
        'graphql',
        entityId,
        this.lockFileService.computeHash(fileContent),
      );
    }

    for (const existingEntity of existingEntities) {
      if (!processedIds.has(existingEntity.id)) {
        const lockEntry = await this.lockFileService.getEntry(workspace.path, 'graphql', existingEntity.id);

        if (lockEntry) {
          await db.delete(graphqlEntities).where(eq(graphqlEntities.id, existingEntity.id));
          await this.lockFileService.removeEntry(workspace.path, 'graphql', existingEntity.id);
        }
      }
    }
  }

  private async applyGraphqlEntityFromYsl(
    workspaceId: string,
    parsed: Infer<typeof GraphqlSchema>,
    exists: boolean,
    validGroupIds: Set<string>,
  ): Promise<void> {
    const db = this.connection.getConnection();
    const { metadata, request, script } = parsed.blocks;
    const groupId = metadata.groupId && validGroupIds.has(metadata.groupId) ? metadata.groupId : null;

    const data = {
      name: metadata.name,
      url: request.url,
      groupId,
      requestHeaders: request.headers,
      requestParameters: request.parameters,
      searchParameters: request.searchParameters,
      requestBody: request.body
        ? {
            type: request.body.type as 'json' | 'text' | 'binary' | 'form-data' | 'x-www-form-urlencoded',
            value: request.body.content ?? '',
            metadata: {},
          }
        : null,
      script: script ? { language: YasumuScriptingLanguage.JavaScript, code: script } : null,
    };

    if (exists) {
      await db.update(graphqlEntities).set(data).where(eq(graphqlEntities.id, metadata.id));
    } else {
      await db.insert(graphqlEntities).values({ id: metadata.id, workspaceId, ...data });
    }
  }

  public async loadEnvironmentsFromFs(workspace: WorkspaceData): Promise<void> {
    const envDir = getWorkspacePath(workspace, 'environment');
    const files = await listYslFiles(envDir);
    const db = this.connection.getConnection();

    const existingEnvs = await this.environmentsService.list(workspace.id);
    const processedIds = new Set<string>();

    for (const filePath of files) {
      const fileContent = await readYslFile(filePath);
      if (!fileContent) continue;

      const parsed = this.yslService.deserialize(EnvironmentSchema, fileContent);
      const envId = parsed.blocks.metadata.id;
      processedIds.add(envId);

      const existingEnv = existingEnvs.find((e) => e.id === envId);
      const dbContent = existingEnv ? serializeEnvironmentContent(existingEnv) : null;

      const { action, state } = await this.determineSyncAction(
        workspace.path,
        'environment',
        envId,
        dbContent,
        fileContent,
      );
      const resolvedAction = await this.resolveSyncAction(action, state);

      if (resolvedAction === 'none') continue;

      if (resolvedAction === 'push') {
        if (existingEnv) {
          await this.pusher.pushEnvironmentToFs(workspace, existingEnv);
        }
        continue;
      }

      if (resolvedAction === 'pull') {
        await this.applyEnvironmentFromYsl(workspace.id, parsed, existingEnv);
      }

      await this.lockFileService.setEntry(
        workspace.path,
        'environment',
        envId,
        this.lockFileService.computeHash(fileContent),
      );
    }

    for (const existingEnv of existingEnvs) {
      if (!processedIds.has(existingEnv.id)) {
        const lockEntry = await this.lockFileService.getEntry(workspace.path, 'environment', existingEnv.id);

        if (lockEntry) {
          await db.delete(environments).where(eq(environments.id, existingEnv.id));
          await this.lockFileService.removeEntry(workspace.path, 'environment', existingEnv.id);
        }
      }
    }
  }

  private async applyEnvironmentFromYsl(
    workspaceId: string,
    parsed: Infer<typeof EnvironmentSchema>,
    existingEnv: { id: string; secrets: { key: string; value: string; enabled: boolean }[] } | undefined,
  ): Promise<void> {
    const db = this.connection.getConnection();
    const { metadata, variables, secrets: parsedSecrets } = parsed.blocks;

    const mergedSecrets = parsedSecrets.map((s) => {
      const existingSecret = existingEnv?.secrets.find((es) => es.key === s.key);
      return { key: s.key, value: existingSecret?.value ?? '', enabled: s.enabled };
    });

    const data = { name: metadata.name, variables, secrets: mergedSecrets };

    if (existingEnv) {
      await db.update(environments).set(data).where(eq(environments.id, metadata.id));
    } else {
      await db.insert(environments).values({ id: metadata.id, workspaceId, ...data });
    }
  }

  public async loadSmtpFromFs(workspace: WorkspaceData): Promise<void> {
    const smtpDir = getWorkspacePath(workspace, 'smtp');
    const smtpFile = join(smtpDir, 'smtp.ysl');
    const fileContent = await readYslFile(smtpFile);

    if (!fileContent) return;

    const existingSmtp = await this.emailService.getSmtp(workspace.id);
    const dbContent = serializeSmtpContent(existingSmtp);

    const { action, state } = await this.determineSyncAction(
      workspace.path,
      'smtp',
      existingSmtp.id,
      dbContent,
      fileContent,
    );
    const resolvedAction = await this.resolveSyncAction(action, state);

    if (resolvedAction === 'none') return;

    if (resolvedAction === 'push') {
      await this.pusher.pushSmtpToFs(workspace, existingSmtp as typeof smtp.$inferSelect);
      return;
    }

    if (resolvedAction === 'pull') {
      await this.applySmtpFromYsl(workspace.id, fileContent, existingSmtp);
    }

    await this.lockFileService.setEntry(
      workspace.path,
      'smtp',
      existingSmtp.id,
      this.lockFileService.computeHash(fileContent),
    );
  }

  private async applySmtpFromYsl(
    workspaceId: string,
    content: string,
    existingSmtp: { id: string; password: string | null },
  ): Promise<void> {
    const parsed = this.yslService.deserialize(SmtpSchema, content);
    const db = this.connection.getConnection();

    await db
      .update(smtp)
      .set({
        port: parsed.blocks.metadata.port,
        username: parsed.blocks.metadata.username,
        password: existingSmtp.password,
        script: parsed.blocks.script
          ? { language: YasumuScriptingLanguage.JavaScript, code: parsed.blocks.script }
          : null,
      })
      .where(and(eq(smtp.workspaceId, workspaceId), eq(smtp.id, existingSmtp.id)));
  }

  private async determineSyncAction(
    workspacePath: string,
    entityType: Parameters<LockFileService['getEntry']>[1],
    entityId: string,
    dbContent: string | null,
    fileContent: string | null,
  ): Promise<{ action: SyncAction; state: SyncEntityState }> {
    const lockEntry = await this.lockFileService.getEntry(workspacePath, entityType, entityId);

    const dbHash = dbContent ? this.lockFileService.computeHash(dbContent) : null;
    const fileHash = fileContent ? this.lockFileService.computeHash(fileContent) : null;
    const lockHash = lockEntry?.hash ?? null;

    const state: SyncEntityState = { entityType, entityId, dbHash, fileHash, lockHash };
    const action = this.lockFileService.determineSyncAction(state);

    return { action, state };
  }

  private async resolveSyncAction(
    action: SyncAction,
    state: SyncEntityState,
  ): Promise<Exclude<SyncAction, 'conflict'>> {
    if (action !== 'conflict') return action;
    const resolution = await this.conflictResolver.resolve(state);
    return resolution.keepLocal ? 'push' : 'pull';
  }
}
