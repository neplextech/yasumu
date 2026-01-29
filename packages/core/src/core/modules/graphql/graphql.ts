import type { Workspace } from '@/core/workspace/workspace.js';
import { GraphqlEntity } from './graphql.entity.js';
import type {
  EntityGroupCreateOptions,
  EntityGroupData,
  EntityGroupUpdateOptions,
  EntityHistoryData,
  GraphqlEntityCreateOptions,
  GraphqlEntityData,
  GraphqlEntityUpdateOptions,
  GraphqlScriptContext,
  GraphqlTreeItem,
  YasumuEmbeddedScript,
} from '@yasumu/common';

export class GraphqlModule {
  public constructor(private readonly workspace: Workspace) {}

  public async create(
    data: GraphqlEntityCreateOptions,
  ): Promise<GraphqlEntity> {
    const result =
      await this.workspace.manager.yasumu.rpc.graphql.create.$mutate({
        parameters: [data],
      });

    return new GraphqlEntity(this, result);
  }

  public async get(id: string): Promise<GraphqlEntity> {
    const data = await this.workspace.manager.yasumu.rpc.graphql.get.$query({
      parameters: [id],
    });
    return new GraphqlEntity(this, data);
  }

  public async delete(id: string): Promise<void> {
    await this.workspace.manager.yasumu.rpc.graphql.delete.$mutate({
      parameters: [id],
    });
  }

  public async update(
    id: string,
    data: Partial<GraphqlEntityUpdateOptions>,
  ): Promise<GraphqlEntityData> {
    const result =
      await this.workspace.manager.yasumu.rpc.graphql.update.$mutate({
        parameters: [id, data],
      });

    return result;
  }

  public async list(): Promise<GraphqlEntity[]> {
    const data = await this.workspace.manager.yasumu.rpc.graphql.list.$query({
      parameters: [],
    });

    return data.map((data) => new GraphqlEntity(this, data));
  }

  public async listTree(): Promise<GraphqlTreeItem[]> {
    const data =
      await this.workspace.manager.yasumu.rpc.graphql.listTree.$query({
        parameters: [],
      });

    // The backend returns a tree structure with folders and files
    return data as unknown as GraphqlTreeItem[];
  }

  public async createEntityGroup(
    data: EntityGroupCreateOptions,
  ): Promise<EntityGroupData> {
    const result =
      await this.workspace.manager.yasumu.rpc.entityGroups.create.$mutate({
        parameters: [data],
      });

    return result;
  }

  public async updateEntityGroup(
    id: string,
    data: EntityGroupUpdateOptions,
  ): Promise<EntityGroupData> {
    const result =
      await this.workspace.manager.yasumu.rpc.entityGroups.update.$mutate({
        parameters: [id, data],
      });

    return result;
  }

  public async deleteEntityGroup(id: string): Promise<void> {
    await this.workspace.manager.yasumu.rpc.entityGroups.delete.$mutate({
      parameters: [id],
    });
  }

  public async executeScript(
    entityId: string,
    script: YasumuEmbeddedScript,
    context: GraphqlScriptContext,
  ) {
    const result =
      await this.workspace.manager.yasumu.rpc.graphql.executeScript.$mutate({
        parameters: [
          {
            entityId,
            script,
            context,
            invocationTarget: !!context.response ? 'onResponse' : 'onRequest',
          },
        ],
      });

    return result;
  }

  public async executeTest(
    entityId: string,
    script: YasumuEmbeddedScript,
    context: GraphqlScriptContext,
  ) {
    const result =
      await this.workspace.manager.yasumu.rpc.graphql.executeScript.$mutate({
        parameters: [
          {
            entityId,
            script,
            context,
            invocationTarget: 'onTest',
          },
        ],
      });

    return result;
  }

  public async listHistory(): Promise<EntityHistoryData[]> {
    const data =
      await this.workspace.manager.yasumu.rpc.entityHistory.list.$query({
        parameters: [{ entityType: 'graphql' }],
      });

    return data;
  }

  public async upsertHistory(entityId: string): Promise<EntityHistoryData> {
    const data =
      await this.workspace.manager.yasumu.rpc.entityHistory.upsert.$mutate({
        parameters: [{ entityId, entityType: 'graphql' }],
      });

    return data;
  }

  public async deleteHistory(entityId: string): Promise<void> {
    await this.workspace.manager.yasumu.rpc.entityHistory.deleteByEntityId.$mutate(
      {
        parameters: [entityId],
      },
    );
  }
}
