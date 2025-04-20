import { HttpMethod } from '@/common/index.js';
import { YasumuBaseModule } from '../common/BaseModule.js';
import { WorkspaceModuleType } from '../common/constants.js';
import { YasumuRestEntity } from './YasumuRestEntity.js';
import { RestEntitySchema } from '@/schema/RestEntitySchema.js';
import { YasumuSchemaActions } from '@yasumu/schema';

export interface CreateRestEntityParams {
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
  method: HttpMethod;
  /**
   * The request url
   */
  url: string;
}

export class YasumuRest extends YasumuBaseModule<
  (typeof WorkspaceModuleType)['Rest']
> {
  public override type = WorkspaceModuleType.Rest;
  public readonly schema = new YasumuSchemaActions(RestEntitySchema);

  /**
   * Open a REST entity by its id.
   * @param id The entity id.
   * @param save Whether to save the entity after opening it. This is useful when you want to save the missing data.
   * @returns The opened entity.
   */
  public async open(id: string, save = true) {
    const data = await this.loadEntity(id);
    const entity = new YasumuRestEntity(this, data);

    if (save) await entity.save();

    return entity;
  }

  /**
   * Create a new REST entity.
   * @param params The entity creation parameters.
   * @returns The created entity.
   */
  public async create(
    params: Partial<CreateRestEntityParams> = {},
  ): Promise<YasumuRestEntity> {
    const entity = new YasumuRestEntity(this, {
      blocks: {
        Metadata: {
          name: params.name || 'Untitled request',
          method: params.method || HttpMethod.Get,
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
