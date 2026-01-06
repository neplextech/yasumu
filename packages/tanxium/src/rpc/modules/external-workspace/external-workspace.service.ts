import { Injectable } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import {
  ExternalWorkspaceExportOptions,
  ExternalWorkspaceImportOptions,
  ExternalWorkspaceImportStrategy,
} from '@yasumu/common';
import {
  NotFoundException,
  NotImplementedException,
} from '../common/exceptions/http.exception.ts';
import { ExternalWorkspaceStrategy } from './strategies/common/external-workspace-strategy.ts';
import { PostmanWorkspaceStrategy } from './strategies/postman/postman-workspace-strategy.ts';
import {
  YasumuWorkspaceFormat,
  YasumuWorkspaceFormatEntityGroup,
} from './strategies/common/yasumu-workspace-format.ts';
import {
  workspaces,
  entityGroups,
  restEntities,
  environments,
} from '../../../database/schema.ts';
import { eq } from 'drizzle-orm';

@Injectable()
export class ExternalWorkspaceService {
  private readonly strategies = new Map<
    ExternalWorkspaceImportStrategy,
    ExternalWorkspaceStrategy
  >();

  public constructor(private readonly connection: TransactionalConnection) {}

  private getStrategy(
    strategy: ExternalWorkspaceImportStrategy,
  ): ExternalWorkspaceStrategy {
    if (this.strategies.has(strategy)) {
      return this.strategies.get(strategy)!;
    }

    switch (strategy) {
      case ExternalWorkspaceImportStrategy.Postman:
        return new PostmanWorkspaceStrategy();
      default:
        return strategy satisfies never;
    }
  }

  public async import(
    workspaceId: string,
    options: ExternalWorkspaceImportOptions,
  ): Promise<boolean> {
    const strategy = this.getStrategy(options.strategy);
    const result = await strategy.import(options.content);

    await this.importYasumuWorkspaceFormat(workspaceId, result);

    return true;
  }

  public async export(
    workspaceId: string,
    options: ExternalWorkspaceExportOptions,
  ): Promise<string> {
    await (void workspaceId, void options);
    throw new NotImplementedException(
      'Exporting external workspaces is not implemented yet',
    );
  }

  private async importYasumuWorkspaceFormat(
    workspaceId: string,
    workspaceData: YasumuWorkspaceFormat,
  ) {
    const db = this.connection.getConnection();

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId));

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.importEnvironments(workspaceId, workspaceData.environments);
    await this.importEntityGroups(workspaceId, workspaceData.entityGroups);
    await this.importRestEntities(workspaceId, workspaceData.rest);
  }

  private async importEnvironments(
    workspaceId: string,
    envs: YasumuWorkspaceFormat['environments'],
  ) {
    if (envs.length === 0) return;

    const db = this.connection.getConnection();
    const now = Date.now();

    for (const env of envs) {
      await db.insert(environments).values({
        id: env.id,
        workspaceId,
        name: env.name,
        variables: env.variables,
        secrets: env.secrets,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  private async importEntityGroups(
    workspaceId: string,
    groups: YasumuWorkspaceFormatEntityGroup[],
  ) {
    if (groups.length === 0) return;

    const db = this.connection.getConnection();
    const now = Date.now();

    const sortedGroups = this.topologicalSortGroups(groups);

    for (const group of sortedGroups) {
      await db.insert(entityGroups).values({
        id: group.id,
        workspaceId,
        name: group.name,
        parentId: group.parentId,
        entityType: 'rest',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  private topologicalSortGroups(
    groups: YasumuWorkspaceFormatEntityGroup[],
  ): YasumuWorkspaceFormatEntityGroup[] {
    const sorted: YasumuWorkspaceFormatEntityGroup[] = [];
    const visited = new Set<string>();
    const groupMap = new Map<string, YasumuWorkspaceFormatEntityGroup>();

    for (const group of groups) {
      groupMap.set(group.id, group);
    }

    const visit = (group: YasumuWorkspaceFormatEntityGroup) => {
      if (visited.has(group.id)) return;

      if (group.parentId) {
        const parent = groupMap.get(group.parentId);
        if (parent) {
          visit(parent);
        }
      }

      visited.add(group.id);
      sorted.push(group);
    };

    for (const group of groups) {
      visit(group);
    }

    return sorted;
  }

  private async importRestEntities(
    workspaceId: string,
    entities: YasumuWorkspaceFormat['rest'],
  ) {
    if (entities.length === 0) return;

    const db = this.connection.getConnection();
    const now = Date.now();

    for (const entity of entities) {
      await db.insert(restEntities).values({
        id: entity.id,
        workspaceId,
        name: entity.name,
        method: entity.method,
        url: entity.url || null,
        groupId: entity.groupId,
        requestHeaders: entity.headers,
        requestParameters: entity.parameters,
        searchParameters: entity.searchParameters,
        requestBody: entity.body,
        script: entity.script,
        testScript: entity.testScript,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}
