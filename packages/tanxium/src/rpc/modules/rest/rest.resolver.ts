import { Mutation, Query, Resolver } from '@yasumu/den';
import { RestService } from './rest.service.ts';
import { WorkspaceId } from '../common/decorators.ts';
import type {
  ExecutableScript,
  RestEntityCreateOptions,
  RestEntityData,
  RestEntityUpdateOptions,
  RestScriptContext,
  ScriptExecutionResult,
} from '@yasumu/common';
import { YasumuRpcService } from '@yasumu/rpc';

@Resolver('rest')
export class RestResolver implements YasumuRpcService<'rest'> {
  public constructor(private readonly restService: RestService) {}

  @Query()
  public async list(
    @WorkspaceId() workspaceId: string,
  ): Promise<RestEntityData[]> {
    return (await this.restService.list(
      workspaceId,
    )) as unknown as RestEntityData[];
  }

  @Query()
  public async listTree(@WorkspaceId() workspaceId: string) {
    return (await this.restService.listTree(
      workspaceId,
    )) as unknown as RestEntityData[];
  }

  @Query()
  public async get(
    @WorkspaceId() workspaceId: string,
    id: string,
  ): Promise<RestEntityData> {
    return (await this.restService.get(
      workspaceId,
      id,
    )) as unknown as RestEntityData;
  }

  @Mutation()
  public async create(
    @WorkspaceId() workspaceId: string,
    data: RestEntityCreateOptions,
  ): Promise<RestEntityData> {
    return (await this.restService.create(
      workspaceId,
      data,
    )) as unknown as RestEntityData;
  }

  @Mutation()
  public async update(
    @WorkspaceId() workspaceId: string,
    id: string,
    data: Partial<RestEntityUpdateOptions>,
  ): Promise<RestEntityData> {
    return (await this.restService.update(
      workspaceId,
      id,
      data,
    )) as unknown as RestEntityData;
  }

  @Mutation()
  public delete(@WorkspaceId() workspaceId: string, id: string) {
    return this.restService.delete(workspaceId, id);
  }

  @Mutation()
  public executeScript(
    @WorkspaceId() workspaceId: string,
    entity: ExecutableScript<RestScriptContext>,
  ): Promise<ScriptExecutionResult<RestScriptContext>> {
    return this.restService.executeScript(workspaceId, entity);
  }
}
