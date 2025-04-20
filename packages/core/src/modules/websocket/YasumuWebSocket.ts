import { WebsocketEntitySchema } from '@/schema/WebsocketEntitySchema.js';
import { YasumuBaseModule } from '../common/BaseModule.js';
import { YasumuSchemaActions } from '@yasumu/schema';
import { YasumuWebSocketEntity } from './YasumuWebSocketEntity.js';
import { WorkspaceModuleType } from '../common/constants.js';

export class YasumuWebSocket extends YasumuBaseModule {
  public type = WorkspaceModuleType.Websocket;
  public schema = new YasumuSchemaActions(WebsocketEntitySchema);

  /**
   * Create a new entity.
   * @param params The entity creation parameters.
   * @returns The created entity.
   */
  public async create(
    params: Partial<{ name: string }> = {},
  ): Promise<YasumuWebSocketEntity> {
    const entity = new YasumuWebSocketEntity(this, {
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
