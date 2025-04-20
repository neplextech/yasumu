import { SseEntitySchema } from '@/schema/SseEntitySchema.js';
import { YasumuBaseModule } from '../common/BaseModule.js';
import { YasumuSchemaActions } from '@yasumu/schema';
import { WorkspaceModuleType } from '../common/constants.js';
import { YasumuSseEntity } from './YasumuSseEntity.js';

export class YasumuSSE extends YasumuBaseModule {
  public type = WorkspaceModuleType.SSE;
  public schema = new YasumuSchemaActions(SseEntitySchema);

  /**
   * Create a new entity.
   * @param params The entity creation parameters.
   * @returns The created entity.
   */
  public async create(
    params: Partial<{ name: string }> = {},
  ): Promise<YasumuSseEntity> {
    const entity = new YasumuSseEntity(this, {
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
