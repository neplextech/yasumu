import { YasumuSchemaActions } from '@yasumu/schema';
import { YasumuBaseModule } from '../common/BaseModule.js';
import { WorkspaceModuleType } from '../common/constants.js';
import { GraphqlEntitySchema } from '@/schema/GraphqlEntitySchema.js';
import { YasumuGraphqlEntity } from './YasumuGraphqlEntity.js';
import { GraphqlHttpMethod } from '@yasumu/common';

export interface CreateGraphqlEntityParams {
  /**
   * The entity name
   */
  name: string;
  /**
   * The entity path
   */
  path: string;
  /**
   * The http method
   */
  method: GraphqlHttpMethod;
  /**
   * The request url
   */
  url: string;
}

export class YasumuGraphql extends YasumuBaseModule<
  (typeof WorkspaceModuleType)['GraphQL']
> {
  public type = WorkspaceModuleType.GraphQL;
  public schema = new YasumuSchemaActions(GraphqlEntitySchema);

  /**
   * Open a GraphQL entity by its id.
   * @param id The entity id.
   * @param save Whether to save the entity after opening it. This is useful when you want to save the missing data.
   * @returns The opened entity.
   */
  public async open(id: string, save = true) {
    const data = await this.loadEntity(id);
    const entity = new YasumuGraphqlEntity(this, data);

    if (save) await entity.save();

    return entity;
  }

  /**
   * Create a new REST entity.
   * @param params The entity creation parameters.
   * @returns The created entity.
   */
  public async create(
    params: Partial<CreateGraphqlEntityParams> = {},
  ): Promise<YasumuGraphqlEntity> {
    const entity = new YasumuGraphqlEntity(this, {
      blocks: {
        Metadata: {
          name: params.name || 'Untitled request',
          method: params.method || GraphqlHttpMethod.Post,
          path: params.path || '/',
        },
        Request: {
          url: params.url || '',
        },
      },
    });

    await entity.save();

    return entity;
  }
}
