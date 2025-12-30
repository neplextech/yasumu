import { EventBus, Injectable, OnModuleInit } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { YslService } from './ysl.service.ts';
import { WorkspaceSchema } from './schema/workspace.schema.ts';
import { YasumuAnnotations } from './schema/constants.ts';
import { WorkspaceData } from '@yasumu/common';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { RestService } from '../rest/rest.service.ts';
import { EntityGroupService } from '../entity-group/entity-group.service.ts';
import { RestSchema } from './schema/rest.schema.ts';
import { EnvironmentSchema } from './schema/environment.schema.ts';
import { SmtpSchema } from './schema/smtp.schema.ts';
import { Infer } from '@yasumu/schema';
import { isDefaultWorkspacePath } from '../../common/constants.ts';
import { WorkspaceEvent } from '../common/events/workspace.event.ts';
import { WorkspaceDiscoveryEvent } from '../common/events/workspace-discovery.event.ts';
import { LockFileService } from './lock-file.service.ts';
import { ConflictResolver } from './conflict-resolver.ts';
import { EnvironmentsService } from '../environment/environment.service.ts';
import { EmailService } from '../email/email.service.ts';
import type { EntityType, SyncAction, SyncEntityState } from './types.ts';
import {
  restEntities,
  environments,
  smtp,
  entityGroups,
  workspaces,
} from '@/database/schema.ts';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class SynchronizationService implements OnModuleInit {
  public constructor(
    private readonly connection: TransactionalConnection,
    private readonly yslService: YslService,
    private readonly restService: RestService,
    private readonly entityGroupService: EntityGroupService,
    private readonly lockFileService: LockFileService,
    private readonly conflictResolver: ConflictResolver,
    private readonly environmentsService: EnvironmentsService,
    private readonly emailService: EmailService,
    private readonly eventBus: EventBus,
  ) {}

  public onModuleInit() {
    this.eventBus
      .ofType(WorkspaceEvent)
      .filter((event) => {
        return event.type === 'activated';
      })
      .subscribe(async (event) => {
        await this.loadFromFileSystem(event.workspaceId);
      });

    this.eventBus.ofType(WorkspaceDiscoveryEvent).subscribe(async (event) => {
      await this.discoverWorkspace(event.workspacePath, event.onComplete);
    });
  }

  private async findWorkspace(id: string): Promise<WorkspaceData | null> {
    const db = this.connection.getConnection();
    const [result] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id));

    return result ?? null;
  }

  private getPath(
    workspace: WorkspaceData,
    target: 'workspace' | 'rest' | 'environment' | 'smtp',
  ) {
    const root = join(workspace.path, 'yasumu');
    switch (target) {
      case 'workspace':
        return root;
      case 'rest':
        return join(root, 'rest');
      case 'environment':
        return join(root, 'environment');
      case 'smtp':
        return root;
      default:
        return target satisfies never;
    }
  }

  private async ensurePath(path: string) {
    if (!existsSync(path)) {
      await Deno.mkdir(path, { recursive: true });
    }
  }

  private async readYslFile(filePath: string): Promise<string | null> {
    if (!existsSync(filePath)) {
      return null;
    }
    try {
      return await Deno.readTextFile(filePath);
    } catch {
      return null;
    }
  }

  private async listYslFiles(dirPath: string): Promise<string[]> {
    if (!existsSync(dirPath)) {
      return [];
    }

    const files: string[] = [];
    try {
      for await (const entry of Deno.readDir(dirPath)) {
        if (entry.isFile && entry.name.endsWith('.ysl')) {
          files.push(join(dirPath, entry.name));
        }
      }
    } catch {
      return [];
    }
    return files;
  }

  private async determineSyncAction(
    workspacePath: string,
    entityType: EntityType,
    entityId: string,
    dbContent: string | null,
    fileContent: string | null,
  ): Promise<{ action: SyncAction; state: SyncEntityState }> {
    const lockEntry = await this.lockFileService.getEntry(
      workspacePath,
      entityType,
      entityId,
    );

    const dbHash = dbContent
      ? this.lockFileService.computeHash(dbContent)
      : null;
    const fileHash = fileContent
      ? this.lockFileService.computeHash(fileContent)
      : null;
    const lockHash = lockEntry?.hash ?? null;

    const state: SyncEntityState = {
      entityType,
      entityId,
      dbHash,
      fileHash,
      lockHash,
    };

    const action = this.lockFileService.determineSyncAction(state);

    return { action, state };
  }

  private async handleConflict(state: SyncEntityState): Promise<boolean> {
    const resolution = await this.conflictResolver.resolve(state);
    return resolution.keepLocal;
  }

  public async loadFromFileSystem(workspaceId: string) {
    const workspace = await this.findWorkspace(workspaceId);

    // skip if the workspace does not exist
    if (!workspace) return;

    if (isDefaultWorkspacePath(workspace.path)) return;

    await this.loadWorkspaceFromFs(workspace);
    await this.loadRestEntitiesFromFs(workspace);
    await this.loadEnvironmentsFromFs(workspace);
    await this.loadSmtpFromFs(workspace);
  }

  private async discoverWorkspace(
    workspacePath: string,
    onComplete: (workspace: WorkspaceData | null) => Promise<void>,
  ) {
    const workspace = await this.createWorkspaceFromFs(workspacePath);
    return onComplete(workspace);
  }

  private async createWorkspaceFromFs(
    workspacePath: string,
  ): Promise<WorkspaceData | null> {
    if (isDefaultWorkspacePath(workspacePath)) return null;

    const workspaceFile = join(workspacePath, 'yasumu', 'workspace.ysl');
    const fileContent = await this.readYslFile(workspaceFile);

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

    for (const [groupId, groupData] of groupEntries) {
      await db.insert(entityGroups).values({
        id: groupId,
        name: groupData.name,
        parentId: groupData.parentId,
        workspaceId: newWorkspace.id,
        entityType: groupData.entity,
      });
    }

    await this.createRestEntitiesFromFs(newWorkspace);
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

  private async createRestEntitiesFromFs(workspace: WorkspaceData) {
    const restDir = this.getPath(workspace, 'rest');
    const files = await this.listYslFiles(restDir);
    const db = this.connection.getConnection();

    for (const filePath of files) {
      const fileContent = await this.readYslFile(filePath);
      if (!fileContent) continue;

      const parsed = this.yslService.deserialize(RestSchema, fileContent);
      const { metadata, request, script, test } = parsed.blocks;

      await db.insert(restEntities).values({
        id: metadata.id,
        workspaceId: workspace.id,
        name: metadata.name,
        method: metadata.method,
        url: request.url,
        groupId: metadata.groupId,
        requestHeaders: request.headers,
        requestParameters: request.parameters,
        searchParameters: request.searchParameters,
        requestBody: request.body
          ? {
              type: request.body.type as
                | 'json'
                | 'text'
                | 'binary'
                | 'form-data'
                | 'x-www-form-urlencoded',
              value: request.body.content ?? '',
              metadata: {},
            }
          : null,
        script: script
          ? { language: 'javascript' as const, code: script }
          : null,
        testScript: test
          ? { language: 'javascript' as const, code: test }
          : null,
      });

      await this.lockFileService.setEntry(
        workspace.path,
        'rest',
        metadata.id,
        this.lockFileService.computeHash(fileContent),
      );
    }
  }

  private async createEnvironmentsFromFs(workspace: WorkspaceData) {
    const envDir = this.getPath(workspace, 'environment');
    const files = await this.listYslFiles(envDir);
    const db = this.connection.getConnection();

    for (const filePath of files) {
      const fileContent = await this.readYslFile(filePath);
      if (!fileContent) continue;

      const parsed = this.yslService.deserialize(
        EnvironmentSchema,
        fileContent,
      );
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

  private async createSmtpFromFs(workspace: WorkspaceData) {
    const smtpDir = this.getPath(workspace, 'smtp');
    const smtpFile = join(smtpDir, 'smtp.ysl');
    const fileContent = await this.readYslFile(smtpFile);

    if (!fileContent) return;

    const parsed = this.yslService.deserialize(SmtpSchema, fileContent);
    const db = this.connection.getConnection();

    await db.insert(smtp).values({
      id: parsed.blocks.metadata.id,
      workspaceId: workspace.id,
      port: parsed.blocks.metadata.port,
      username: parsed.blocks.metadata.username,
      password: null,
    });

    await this.lockFileService.setEntry(
      workspace.path,
      'smtp',
      parsed.blocks.metadata.id,
      this.lockFileService.computeHash(fileContent),
    );
  }

  private async loadWorkspaceFromFs(workspace: WorkspaceData) {
    const workspaceDir = this.getPath(workspace, 'workspace');
    const workspaceFile = join(workspaceDir, 'workspace.ysl');
    const fileContent = await this.readYslFile(workspaceFile);

    if (!fileContent) return;

    const dbContent = this.serializeWorkspaceContent(workspace);
    const { action, state } = await this.determineSyncAction(
      workspace.path,
      'workspace',
      workspace.id,
      dbContent,
      fileContent,
    );

    if (action === 'none') return;

    if (action === 'conflict') {
      const keepLocal = await this.handleConflict(state);
      if (keepLocal) {
        await this.pushWorkspaceToFs(workspace);
        return;
      }
    }

    if (
      action === 'pull' ||
      (action === 'conflict' && !(await this.handleConflict(state)))
    ) {
      await this.applyWorkspaceFromYsl(workspace, fileContent);
    }

    await this.lockFileService.setEntry(
      workspace.path,
      'workspace',
      workspace.id,
      this.lockFileService.computeHash(fileContent),
    );
  }

  private async applyWorkspaceFromYsl(
    workspace: WorkspaceData,
    content: string,
  ) {
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

    for (const [groupId, groupData] of Object.entries(parsed.blocks.groups)) {
      if (existingGroupIds.has(groupId)) {
        await db
          .update(entityGroups)
          .set({
            name: groupData.name,
            parentId: groupData.parentId,
          })
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
        await db
          .delete(entityGroups)
          .where(eq(entityGroups.id, existingGroup.id));
      }
    }
  }

  private async loadRestEntitiesFromFs(workspace: WorkspaceData) {
    const restDir = this.getPath(workspace, 'rest');
    const files = await this.listYslFiles(restDir);
    const db = this.connection.getConnection();

    const existingEntities = await this.restService.list(workspace.id);
    const existingIds = new Set(existingEntities.map((e) => e.id));
    const processedIds = new Set<string>();

    for (const filePath of files) {
      const fileContent = await this.readYslFile(filePath);
      if (!fileContent) continue;

      const parsed = this.yslService.deserialize(RestSchema, fileContent);
      const entityId = parsed.blocks.metadata.id;
      processedIds.add(entityId);

      const existingEntity = existingEntities.find((e) => e.id === entityId);
      const dbContent = existingEntity
        ? this.serializeRestContent(existingEntity)
        : null;

      const { action, state } = await this.determineSyncAction(
        workspace.path,
        'rest',
        entityId,
        dbContent,
        fileContent,
      );

      if (action === 'none') continue;

      if (action === 'conflict') {
        const keepLocal = await this.handleConflict(state);
        if (keepLocal) {
          if (existingEntity) {
            await this.pushRestEntityToFs(workspace, existingEntity);
          }
          continue;
        }
      }

      if (action === 'pull' || action === 'conflict') {
        await this.applyRestEntityFromYsl(
          workspace.id,
          parsed,
          existingIds.has(entityId),
        );
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
        const lockEntry = await this.lockFileService.getEntry(
          workspace.path,
          'rest',
          existingEntity.id,
        );

        if (lockEntry) {
          await db
            .delete(restEntities)
            .where(eq(restEntities.id, existingEntity.id));
          await this.lockFileService.removeEntry(
            workspace.path,
            'rest',
            existingEntity.id,
          );
        }
      }
    }
  }

  private async applyRestEntityFromYsl(
    workspaceId: string,
    parsed: Infer<typeof RestSchema>,
    exists: boolean,
  ) {
    const db = this.connection.getConnection();
    const { metadata, request, script, test } = parsed.blocks;

    const data = {
      name: metadata.name,
      method: metadata.method,
      url: request.url,
      groupId: metadata.groupId,
      requestHeaders: request.headers,
      requestParameters: request.parameters,
      searchParameters: request.searchParameters,
      requestBody: request.body
        ? {
            type: request.body.type as
              | 'json'
              | 'text'
              | 'binary'
              | 'form-data'
              | 'x-www-form-urlencoded',
            value: request.body.content ?? '',
            metadata: {},
          }
        : null,
      script: script ? { language: 'javascript' as const, code: script } : null,
      testScript: test ? { language: 'javascript' as const, code: test } : null,
    };

    if (exists) {
      await db
        .update(restEntities)
        .set(data)
        .where(eq(restEntities.id, metadata.id));
    } else {
      await db.insert(restEntities).values({
        id: metadata.id,
        workspaceId,
        ...data,
      });
    }
  }

  private async loadEnvironmentsFromFs(workspace: WorkspaceData) {
    const envDir = this.getPath(workspace, 'environment');
    const files = await this.listYslFiles(envDir);
    const db = this.connection.getConnection();

    const existingEnvs = await this.environmentsService.list(workspace.id);
    const processedIds = new Set<string>();

    for (const filePath of files) {
      const fileContent = await this.readYslFile(filePath);
      if (!fileContent) continue;

      const parsed = this.yslService.deserialize(
        EnvironmentSchema,
        fileContent,
      );
      const envId = parsed.blocks.metadata.id;
      processedIds.add(envId);

      const existingEnv = existingEnvs.find((e) => e.id === envId);
      const dbContent = existingEnv
        ? this.serializeEnvironmentContent(existingEnv)
        : null;

      const { action, state } = await this.determineSyncAction(
        workspace.path,
        'environment',
        envId,
        dbContent,
        fileContent,
      );

      if (action === 'none') continue;

      if (action === 'conflict') {
        const keepLocal = await this.handleConflict(state);
        if (keepLocal) {
          if (existingEnv) {
            await this.pushEnvironmentToFs(workspace, existingEnv);
          }
          continue;
        }
      }

      if (action === 'pull' || action === 'conflict') {
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
        const lockEntry = await this.lockFileService.getEntry(
          workspace.path,
          'environment',
          existingEnv.id,
        );

        if (lockEntry) {
          await db
            .delete(environments)
            .where(eq(environments.id, existingEnv.id));
          await this.lockFileService.removeEntry(
            workspace.path,
            'environment',
            existingEnv.id,
          );
        }
      }
    }
  }

  private async applyEnvironmentFromYsl(
    workspaceId: string,
    parsed: Infer<typeof EnvironmentSchema>,
    existingEnv:
      | {
          id: string;
          secrets: { key: string; value: string; enabled: boolean }[];
        }
      | undefined,
  ) {
    const db = this.connection.getConnection();
    const { metadata, variables, secrets: parsedSecrets } = parsed.blocks;

    const mergedSecrets = parsedSecrets.map((s) => {
      const existingSecret = existingEnv?.secrets.find(
        (es) => es.key === s.key,
      );
      return {
        key: s.key,
        value: existingSecret?.value ?? '',
        enabled: s.enabled,
      };
    });

    const data = {
      name: metadata.name,
      variables,
      secrets: mergedSecrets,
    };

    if (existingEnv) {
      await db
        .update(environments)
        .set(data)
        .where(eq(environments.id, metadata.id));
    } else {
      await db.insert(environments).values({
        id: metadata.id,
        workspaceId,
        ...data,
      });
    }
  }

  private async loadSmtpFromFs(workspace: WorkspaceData) {
    const smtpDir = this.getPath(workspace, 'smtp');
    const smtpFile = join(smtpDir, 'smtp.ysl');
    const fileContent = await this.readYslFile(smtpFile);

    if (!fileContent) return;

    const existingSmtp = await this.emailService.getSmtp(workspace.id);
    const dbContent = this.serializeSmtpContent(existingSmtp);

    const { action, state } = await this.determineSyncAction(
      workspace.path,
      'smtp',
      existingSmtp.id,
      dbContent,
      fileContent,
    );

    if (action === 'none') return;

    if (action === 'conflict') {
      const keepLocal = await this.handleConflict(state);
      if (keepLocal) {
        await this.pushSmtpToFs(workspace, existingSmtp);
        return;
      }
    }

    if (action === 'pull' || action === 'conflict') {
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
  ) {
    const parsed = this.yslService.deserialize(SmtpSchema, content);
    const db = this.connection.getConnection();

    await db
      .update(smtp)
      .set({
        port: parsed.blocks.metadata.port,
        username: parsed.blocks.metadata.username,
        password: existingSmtp.password,
      })
      .where(
        and(eq(smtp.workspaceId, workspaceId), eq(smtp.id, existingSmtp.id)),
      );
  }

  private serializeWorkspaceContent(workspace: WorkspaceData): string {
    return JSON.stringify({
      name: workspace.name,
      version: workspace.version,
    });
  }

  private serializeRestContent(entity: {
    id: string;
    name: string;
    method: string;
    url: string | null;
    groupId: string | null;
    requestHeaders: { key: string; value: string; enabled: boolean }[] | null;
    requestParameters:
      | { key: string; value: string; enabled: boolean }[]
      | null;
    searchParameters: { key: string; value: string; enabled: boolean }[] | null;
    requestBody: { type: string; value: unknown } | null;
    script: { code: string } | null;
    testScript: { code: string } | null;
  }): string {
    return JSON.stringify({
      id: entity.id,
      name: entity.name,
      method: entity.method,
      url: entity.url,
      groupId: entity.groupId,
      headers: entity.requestHeaders ?? [],
      parameters: entity.requestParameters ?? [],
      searchParameters: entity.searchParameters ?? [],
      body: entity.requestBody,
      script: entity.script,
      testScript: entity.testScript,
    });
  }

  private serializeEnvironmentContent(env: {
    id: string;
    name: string;
    variables: { key: string; value: string; enabled: boolean }[];
  }): string {
    return JSON.stringify({
      id: env.id,
      name: env.name,
      variables: env.variables,
    });
  }

  private serializeSmtpContent(smtpConfig: {
    id: string;
    port: number;
    username: string | null;
  }): string {
    return JSON.stringify({
      id: smtpConfig.id,
      port: smtpConfig.port,
      username: smtpConfig.username,
    });
  }

  private async pushWorkspaceToFs(workspace: WorkspaceData) {
    const groups = await this.entityGroupService
      .findAll(workspace.id)
      .catch(() => []);

    const content = this.yslService.serialize(WorkspaceSchema, {
      annotation: YasumuAnnotations.Workspace,
      blocks: {
        metadata: {
          id: workspace.id,
          name: workspace.name,
          version: workspace.version,
        },
        groups: groups.reduce(
          (acc, group) => {
            acc[group.id] = {
              id: group.id,
              name: group.name,
              entity: group.entityType,
              parentId: group.parentId,
              workspaceId: group.workspaceId,
            };
            return acc;
          },
          {} as Infer<typeof WorkspaceSchema>['blocks']['groups'],
        ),
        snapshot: Date.now(),
      },
    });

    const workspaceDir = this.getPath(workspace, 'workspace');
    await this.ensurePath(workspaceDir);
    await this.yslService.emit(content, join(workspaceDir, 'workspace.ysl'));
    await this.lockFileService.setEntry(
      workspace.path,
      'workspace',
      workspace.id,
      this.lockFileService.computeHash(content),
    );
  }

  private async pushRestEntityToFs(
    workspace: WorkspaceData,
    entity: {
      id: string;
      name: string;
      method: string;
      url: string | null;
      groupId: string | null;
      requestHeaders: { key: string; value: string; enabled: boolean }[] | null;
      requestParameters:
        | { key: string; value: string; enabled: boolean }[]
        | null;
      searchParameters:
        | { key: string; value: string; enabled: boolean }[]
        | null;
      requestBody: { type: string; value: unknown } | null;
      script: { code: string } | null;
      testScript: { code: string } | null;
    },
  ) {
    const content = this.yslService.serialize(RestSchema, {
      annotation: YasumuAnnotations.Rest,
      blocks: {
        dependencies: [],
        metadata: {
          groupId: entity.groupId,
          id: entity.id,
          method: entity.method,
          name: entity.name,
        },
        request: {
          body: entity.requestBody
            ? {
                type: entity.requestBody.type,
                content:
                  typeof entity.requestBody.value === 'string'
                    ? entity.requestBody.value
                    : JSON.stringify(entity.requestBody.value),
              }
            : null,
          headers: (entity.requestHeaders ?? []).map((h) => ({
            key: h.key ?? '',
            value: h.value ?? '',
            enabled: h.enabled,
          })),
          parameters: (entity.requestParameters ?? []).map((p) => ({
            key: p.key ?? '',
            value: p.value ?? '',
            enabled: p.enabled,
          })),
          searchParameters: (entity.searchParameters ?? []).map((s) => ({
            key: s.key ?? '',
            value: s.value ?? '',
            enabled: s.enabled,
          })),
          url: entity.url,
        },
        script: entity.script?.code ?? null,
        test: entity.testScript?.code ?? null,
      },
    });

    const restDir = this.getPath(workspace, 'rest');
    await this.ensurePath(restDir);
    await this.yslService.emit(content, join(restDir, `${entity.id}.ysl`));
    await this.lockFileService.setEntry(
      workspace.path,
      'rest',
      entity.id,
      this.lockFileService.computeHash(content),
    );
  }

  private async pushEnvironmentToFs(
    workspace: WorkspaceData,
    env: {
      id: string;
      name: string;
      variables: { key: string; value: string; enabled: boolean }[];
      secrets: { key: string; value: string; enabled: boolean }[];
    },
  ) {
    const content = this.yslService.serialize(EnvironmentSchema, {
      annotation: YasumuAnnotations.Environment,
      blocks: {
        metadata: {
          id: env.id,
          name: env.name,
        },
        variables: env.variables.map((v) => ({
          key: v.key,
          value: v.value ?? '',
          enabled: v.enabled,
        })),
        secrets: env.secrets.map((s) => ({
          key: s.key,
          value: '',
          enabled: s.enabled,
        })),
      },
    });

    const envDir = this.getPath(workspace, 'environment');
    await this.ensurePath(envDir);
    await this.yslService.emit(content, join(envDir, `${env.id}.ysl`));
    await this.lockFileService.setEntry(
      workspace.path,
      'environment',
      env.id,
      this.lockFileService.computeHash(content),
    );
  }

  private async pushSmtpToFs(
    workspace: WorkspaceData,
    smtpConfig: {
      id: string;
      port: number;
      username: string | null;
    },
  ) {
    const content = this.yslService.serialize(SmtpSchema, {
      annotation: YasumuAnnotations.Smtp,
      blocks: {
        metadata: {
          id: smtpConfig.id,
          port: smtpConfig.port,
          username: smtpConfig.username,
          password: null,
        },
      },
    });

    const smtpDir = this.getPath(workspace, 'smtp');
    await this.ensurePath(smtpDir);
    await this.yslService.emit(content, join(smtpDir, 'smtp.ysl'));
    await this.lockFileService.setEntry(
      workspace.path,
      'smtp',
      smtpConfig.id,
      this.lockFileService.computeHash(content),
    );
  }

  public async synchronizeWorkspace(workspaceId: string) {
    const workspace = await this.findWorkspace(workspaceId);

    if (!workspace) return;
    // do not attempt to synchronize the workspace if it is the default workspace
    // as default workspace is virtual and acts as a scratchpad for the user
    // and is not meant to be synchronized with the file system
    if (isDefaultWorkspacePath(workspace.path)) return;

    await this.pushWorkspaceToFs(workspace);

    const restEntitiesList = await this.restService.list(workspaceId);
    const restEntityIds = new Set(restEntitiesList.map((e) => e.id));

    for (const entity of restEntitiesList) {
      await this.pushRestEntityToFs(workspace, entity);
    }

    await this.cleanupDeletedFiles(workspace, 'rest', restEntityIds);

    const envList = await this.environmentsService.list(workspaceId);
    const envIds = new Set(envList.map((e) => e.id));

    for (const env of envList) {
      await this.pushEnvironmentToFs(workspace, env);
    }

    await this.cleanupDeletedFiles(workspace, 'environment', envIds);

    const smtpConfig = await this.emailService.getSmtp(workspaceId);
    await this.pushSmtpToFs(workspace, smtpConfig);
  }

  private async cleanupDeletedFiles(
    workspace: WorkspaceData,
    entityType: 'rest' | 'environment',
    existingIds: Set<string>,
  ) {
    const dir = this.getPath(workspace, entityType);
    const files = await this.listYslFiles(dir);

    for (const filePath of files) {
      const fileName = filePath.split('/').pop() ?? '';
      const entityId = fileName.replace('.ysl', '');

      if (!existingIds.has(entityId)) {
        try {
          await Deno.remove(filePath);
        } catch {
          // ignore removal errors
        }
        await this.lockFileService.removeEntry(
          workspace.path,
          entityType,
          entityId,
        );
      }
    }
  }
}
