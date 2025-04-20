import type { WebsocketEntitySchemaType } from '@/schema/WebsocketEntitySchema.js';
import { BaseEntity } from '../common/BaseEntity.js';
import {
  type ExecutionOptions,
  type ExecutionResult,
} from '../common/types.js';
import type { YasumuWebSocket } from './YasumuWebSocket.js';
import type { DeepPartial } from '../rest/YasumuRestEntity.js';
import { generateId } from '@/common/utils.js';
import type { WebsocketIndex } from './types.js';

export class YasumuWebSocketEntity extends BaseEntity<WebsocketEntitySchemaType> {
  public data!: WebsocketEntitySchemaType;

  /**
   * Construct a new rest entity
   * @param module The rest module that manages this entity
   * @param data The data of this entity
   */
  public constructor(
    public readonly module: YasumuWebSocket,
    data?: DeepPartial<WebsocketEntitySchemaType>,
  ) {
    super();
    this.#reformat(data);
  }

  #reformat(data?: DeepPartial<WebsocketEntitySchemaType>) {
    this.data = {
      annotation: this.module.type,
      blocks: {
        Metadata: {
          createdAt: data?.blocks?.Metadata?.createdAt || Date.now(),
          id: data?.blocks?.Metadata?.id || generateId(),
          name: data?.blocks?.Metadata?.name || 'Untitled request',
          path: data?.blocks?.Metadata?.path || '/',
        },
      },
    };
  }

  /**
   * The root index data of this entity
   */
  public createRootIndexData(): WebsocketIndex {
    return {
      id: this.data.blocks.Metadata.id,
      name: this.data.blocks.Metadata.name,
      path: this.data.blocks.Metadata.path,
    };
  }

  public async execute(options?: ExecutionOptions): Promise<ExecutionResult> {
    return {} as ExecutionResult;
  }
}
