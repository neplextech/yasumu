import { type SocketioEntitySchemaType } from '@/schema/SocketioEntitySchema.js';
import { BaseEntity } from '../common/BaseEntity.js';
import {
  type ExecutionOptions,
  type ExecutionResult,
} from '../common/types.js';
import type { YasumuSocketIO } from './YasumuSocketIO.js';
import type { DeepPartial } from '../rest/YasumuRestEntity.js';
import { generateId } from '@/common/utils.js';
import type { SocketioIndex } from './types.js';

export class YasumuSocketIOEntity extends BaseEntity<SocketioEntitySchemaType> {
  public data!: SocketioEntitySchemaType;

  /**
   * Construct a new rest entity
   * @param module The rest module that manages this entity
   * @param data The data of this entity
   */
  public constructor(
    public readonly module: YasumuSocketIO,
    data?: DeepPartial<SocketioEntitySchemaType>,
  ) {
    super();
    this.#reformat(data);
  }

  #reformat(data?: DeepPartial<SocketioEntitySchemaType>) {
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
  public createRootIndexData(): SocketioIndex {
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
