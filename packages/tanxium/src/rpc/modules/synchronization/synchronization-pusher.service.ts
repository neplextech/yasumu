import { basename, join } from 'node:path';

import { WorkspaceData, YasumuScriptingLanguage } from '@yasumu/common';
import { Injectable } from '@yasumu/den';
import { Infer } from '@yasumu/schema';
import {
  EnvironmentSchema,
  GraphqlSchema,
  LockFileService,
  RestSchema,
  SmtpSchema,
  WorkspaceSchema,
  YasumuAnnotations,
  YslService,
} from '@yasumu/sync';

import { smtp } from '@/database/schema.ts';

import { EmailService } from '../email/email.service.ts';
import { EntityGroupService } from '../entity-group/entity-group.service.ts';
import { EnvironmentsService } from '../environment/environment.service.ts';
import { GraphqlService } from '../graphql/graphql.service.ts';
import { RestService } from '../rest/rest.service.ts';
import { ensurePath, getWorkspacePath, listYslFiles } from './fs-helpers.ts';

@Injectable()
export class SynchronizationPusher {
  public constructor(
    private readonly yslService: YslService,
    private readonly lockFileService: LockFileService,
    private readonly entityGroupService: EntityGroupService,
    private readonly restService: RestService,
    private readonly graphqlService: GraphqlService,
    private readonly environmentsService: EnvironmentsService,
    private readonly emailService: EmailService,
  ) {}

  public async pushAll(workspace: WorkspaceData): Promise<void> {
    await this.pushWorkspaceToFs(workspace);

    const restEntitiesList = await this.restService.list(workspace.id);
    const restEntityIds = new Set(restEntitiesList.map((e) => e.id));
    for (const entity of restEntitiesList) {
      await this.pushRestEntityToFs(workspace, entity);
    }
    await this.cleanupDeletedFiles(workspace, 'rest', restEntityIds);

    const graphqlEntitiesList = await this.graphqlService.list(workspace.id);
    const graphqlEntityIds = new Set(graphqlEntitiesList.map((e) => e.id));
    for (const entity of graphqlEntitiesList) {
      await this.pushGraphqlEntityToFs(workspace, entity);
    }
    await this.cleanupDeletedFiles(workspace, 'graphql', graphqlEntityIds);

    const envList = await this.environmentsService.list(workspace.id);
    const envIds = new Set(envList.map((e) => e.id));
    for (const env of envList) {
      await this.pushEnvironmentToFs(workspace, env);
    }
    await this.cleanupDeletedFiles(workspace, 'environment', envIds);

    const smtpConfig = await this.emailService.getSmtp(workspace.id);
    await this.pushSmtpToFs(workspace, smtpConfig);
  }

  public async pushWorkspaceToFs(workspace: WorkspaceData): Promise<void> {
    const groups = await this.entityGroupService.findAll(workspace.id).catch(() => []);

    const groupsMap = groups.reduce(
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
    );

    const content = this.yslService.serialize(WorkspaceSchema, {
      annotation: YasumuAnnotations.Workspace,
      blocks: {
        metadata: { id: workspace.id, name: workspace.name, version: workspace.version },
        groups: groupsMap,
        snapshot: Date.now(),
      },
    });

    // Normalize snapshot to 0 for the lock hash so the loader's comparison
    // (which also normalizes to 0) stays stable across pushes.
    const normalizedContent = this.yslService.serialize(WorkspaceSchema, {
      annotation: YasumuAnnotations.Workspace,
      blocks: {
        metadata: { id: workspace.id, name: workspace.name, version: workspace.version },
        groups: groupsMap,
        snapshot: 0,
      },
    });

    const workspaceDir = getWorkspacePath(workspace, 'workspace');
    await ensurePath(workspaceDir);
    await this.yslService.emit(content, join(workspaceDir, 'workspace.ysl'));
    await this.lockFileService.setEntry(
      workspace.path,
      'workspace',
      workspace.id,
      this.lockFileService.computeHash(normalizedContent),
    );
  }

  public async pushRestEntityToFs(
    workspace: WorkspaceData,
    entity: {
      id: string;
      name: string;
      method: string;
      url: string | null;
      groupId: string | null;
      requestHeaders: { key: string; value: string; enabled: boolean }[] | null;
      requestParameters: { key: string; value: string; enabled: boolean }[] | null;
      searchParameters: { key: string; value: string; enabled: boolean }[] | null;
      requestBody: { type: string; value: unknown } | null;
      script: { code: string } | null;
    },
  ): Promise<void> {
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
        test: null,
      },
    });

    const restDir = getWorkspacePath(workspace, 'rest');
    await ensurePath(restDir);
    await this.yslService.emit(content, join(restDir, `${entity.id}.ysl`));
    await this.lockFileService.setEntry(workspace.path, 'rest', entity.id, this.lockFileService.computeHash(content));
  }

  public async pushGraphqlEntityToFs(
    workspace: WorkspaceData,
    entity: {
      id: string;
      name: string;
      url: string | null;
      groupId: string | null;
      requestHeaders: { key: string; value: string; enabled: boolean }[] | null;
      requestParameters: { key: string; value: string; enabled: boolean }[] | null;
      searchParameters: { key: string; value: string; enabled: boolean }[] | null;
      requestBody: { type: string; value: unknown } | null;
      script: { code: string } | null;
    },
  ): Promise<void> {
    const content = this.yslService.serialize(GraphqlSchema, {
      annotation: YasumuAnnotations.Graphql,
      blocks: {
        dependencies: [],
        metadata: {
          groupId: entity.groupId,
          id: entity.id,
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
        test: null,
      },
    });

    const graphqlDir = getWorkspacePath(workspace, 'graphql');
    await ensurePath(graphqlDir);
    await this.yslService.emit(content, join(graphqlDir, `${entity.id}.ysl`));
    await this.lockFileService.setEntry(
      workspace.path,
      'graphql',
      entity.id,
      this.lockFileService.computeHash(content),
    );
  }

  public async pushEnvironmentToFs(
    workspace: WorkspaceData,
    env: {
      id: string;
      name: string;
      variables: { key: string; value: string; enabled: boolean }[];
      secrets: { key: string; value: string; enabled: boolean }[];
    },
  ): Promise<void> {
    const content = this.yslService.serialize(EnvironmentSchema, {
      annotation: YasumuAnnotations.Environment,
      blocks: {
        metadata: { id: env.id, name: env.name },
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

    const envDir = getWorkspacePath(workspace, 'environment');
    await ensurePath(envDir);
    await this.yslService.emit(content, join(envDir, `${env.id}.ysl`));
    await this.lockFileService.setEntry(
      workspace.path,
      'environment',
      env.id,
      this.lockFileService.computeHash(content),
    );
  }

  public async pushSmtpToFs(workspace: WorkspaceData, smtpConfig: typeof smtp.$inferSelect): Promise<void> {
    const content = this.yslService.serialize(SmtpSchema, {
      annotation: YasumuAnnotations.Smtp,
      blocks: {
        metadata: {
          id: smtpConfig.id,
          port: smtpConfig.port,
          username: smtpConfig.username,
          password: null,
        },
        script: smtpConfig.script?.code ?? null,
      },
    });

    const smtpDir = getWorkspacePath(workspace, 'smtp');
    await ensurePath(smtpDir);
    await this.yslService.emit(content, join(smtpDir, 'smtp.ysl'));
    await this.lockFileService.setEntry(
      workspace.path,
      'smtp',
      smtpConfig.id,
      this.lockFileService.computeHash(content),
    );
  }

  public async cleanupDeletedFiles(
    workspace: WorkspaceData,
    entityType: 'rest' | 'graphql' | 'environment',
    existingIds: Set<string>,
  ): Promise<void> {
    const dir = getWorkspacePath(workspace, entityType);
    const files = await listYslFiles(dir);

    for (const filePath of files) {
      const fileName = basename(filePath);
      const entityId = fileName.replace('.ysl', '');

      if (!existingIds.has(entityId)) {
        try {
          await Deno.remove(filePath);
        } catch {
          // ignore removal errors
        }
        await this.lockFileService.removeEntry(workspace.path, entityType, entityId);
      }
    }
  }
}
