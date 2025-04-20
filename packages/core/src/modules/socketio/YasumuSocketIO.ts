import { WorkspaceModuleType } from '../common/constants.js';
import { SocketioEntitySchema } from '@/schema/SocketioEntitySchema.js';
import { YasumuBaseModule } from '../common/BaseModule.js';
import { YasumuSchemaActions } from '@yasumu/schema';
import { YasumuSocketIOEntity } from './YasumuSocketIOEntity.js';

export class YasumuSocketIO extends YasumuBaseModule {
  public type = WorkspaceModuleType.SocketIO;
  public schema = new YasumuSchemaActions(SocketioEntitySchema);

  /**
   * Create a new entity.
   * @param params The entity creation parameters.
   * @returns The created entity.
   */
  public async create(
    params: Partial<{ name: string }> = {},
  ): Promise<YasumuSocketIOEntity> {
    const entity = new YasumuSocketIOEntity(this, {
      blocks: {
        Metadata: {
          name: params.name || 'Untitled request',
        },
      },
    });

    await entity.save();

    return entity;
  }
}
