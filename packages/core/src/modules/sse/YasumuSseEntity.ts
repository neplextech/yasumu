import type { SseEntitySchemaType } from '@/schema/SseEntitySchema.js';
import { BaseEntity } from '../common/BaseEntity.js';
import {
  type ExecutionOptions,
  type ExecutionResult,
} from '../common/types.js';
import type { YasumuSSE } from './YasumuSSE.js';
import type { DeepPartial } from '../rest/YasumuRestEntity.js';
import { generateId } from '@/common/utils.js';
import type { SseIndex } from './types.js';

export class YasumuSseEntity extends BaseEntity<SseEntitySchemaType> {
  public data!: SseEntitySchemaType;

  /**
   * Construct a new rest entity
   * @param module The rest module that manages this entity
   * @param data The data of this entity
   */
  public constructor(
    public readonly module: YasumuSSE,
    data?: DeepPartial<SseEntitySchemaType>,
  ) {
    super();
    this.#reformat(data);
  }

  #reformat(data?: DeepPartial<SseEntitySchemaType>) {
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
  public createRootIndexData(): SseIndex {
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
