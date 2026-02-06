import { Mutation, Query, Resolver } from '@yasumu/den';
import { GraphqlService } from './graphql.service.ts';
import { WorkspaceId } from '../common/decorators.ts';
import type {
  ExecutableScript,
  GraphqlEntityCreateOptions,
  GraphqlEntityData,
  GraphqlEntityUpdateOptions,
  GraphqlScriptContext,
  ScriptExecutionResult,
} from '@yasumu/common';
import { YasumuRpcService } from '@yasumu/rpc';

@Resolver('graphql')
export class GraphqlResolver implements YasumuRpcService<'graphql'> {
  public constructor(private readonly graphqlService: GraphqlService) {}

  @Query()
  public async list(
    @WorkspaceId() workspaceId: string,
  ): Promise<GraphqlEntityData[]> {
    return (await this.graphqlService.list(
      workspaceId,
    )) as unknown as GraphqlEntityData[];
  }

  @Query()
  public async listTree(@WorkspaceId() workspaceId: string) {
    return (await this.graphqlService.listTree(
      workspaceId,
    )) as unknown as GraphqlEntityData[];
  }

  @Query()
  public async get(
    @WorkspaceId() workspaceId: string,
    id: string,
  ): Promise<GraphqlEntityData> {
    return (await this.graphqlService.get(
      workspaceId,
      id,
    )) as unknown as GraphqlEntityData;
  }

  @Mutation()
  public async create(
    @WorkspaceId() workspaceId: string,
    data: GraphqlEntityCreateOptions,
  ): Promise<GraphqlEntityData> {
    return (await this.graphqlService.create(
      workspaceId,
      data,
    )) as unknown as GraphqlEntityData;
  }

  @Mutation()
  public async update(
    @WorkspaceId() workspaceId: string,
    id: string,
    data: Partial<GraphqlEntityUpdateOptions>,
  ): Promise<GraphqlEntityData> {
    return (await this.graphqlService.update(
      workspaceId,
      id,
      data,
    )) as unknown as GraphqlEntityData;
  }

  @Mutation()
  public delete(@WorkspaceId() workspaceId: string, id: string) {
    return this.graphqlService.delete(workspaceId, id);
  }

  @Mutation()
  public executeScript(
    @WorkspaceId() workspaceId: string,
    entity: ExecutableScript<GraphqlScriptContext>,
  ): Promise<ScriptExecutionResult<GraphqlScriptContext>> {
    return this.graphqlService.executeScript(workspaceId, entity);
  }
}
