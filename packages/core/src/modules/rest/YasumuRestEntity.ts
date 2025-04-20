import { generateId } from '@/common/utils.js';
import { BaseEntity } from '../common/BaseEntity.js';
import {
  ScriptType,
  type ExecutionOptions,
  type ExecutionResult,
} from '../common/types.js';
import type { RestIndex } from './types.js';
import type { YasumuRest } from './YasumuRest.js';
import { HttpMethod } from '@/common/index.js';
import type { RestEntitySchemaType } from '@/schema/RestEntitySchema.js';

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export class YasumuRestEntity extends BaseEntity<RestEntitySchemaType> {
  public data!: RestEntitySchemaType;

  /**
   * Construct a new rest entity
   * @param module The rest module that manages this entity
   * @param data The data of this entity
   */
  public constructor(
    public readonly module: YasumuRest,
    data?: DeepPartial<RestEntitySchemaType>,
  ) {
    super();
    this.#reformat(data);
  }

  #reformat(data?: DeepPartial<RestEntitySchemaType>) {
    if (!data || typeof data !== 'object') {
      data = {
        blocks: {},
      } as RestEntitySchemaType;
    }

    data.annotation = this.module.type;
    data.blocks!.Metadata ??= {} as RestIndex;
    data.blocks!.Metadata.createdAt ??= Date.now();
    data.blocks!.Metadata.id ??= generateId();
    data.blocks!.Metadata.method ??= HttpMethod.Get;
    data.blocks!.Metadata.name ??= 'Untitled request';
    data.blocks!.Metadata.path ??= '/';
    data.blocks!.Request = {
      headers: data.blocks!.Request?.headers ?? [],
      url: data.blocks!.Request?.url ?? '',
    };
    data.blocks!.Response = {
      headers: data.blocks!.Response?.headers ?? [],
      status: data.blocks!.Response?.status ?? null,
      body: data.blocks!.Response?.body ?? null,
      size: data.blocks!.Response?.size ?? null,
      time: data.blocks!.Response?.time ?? null,
    };
    data.blocks!.AfterResponse ??= '';
    data.blocks!.BeforeRequest ??= '';
    data.blocks!.Test ??= '';

    this.data = data as RestEntitySchemaType;
  }

  /**
   * The http method of this entity
   */
  public get method() {
    return (this.data.blocks.Metadata.method ??= HttpMethod.Get);
  }

  /**
   * The url of this entity
   */
  public get url() {
    return this.data.blocks.Request.url || '';
  }

  /**
   * The headers of this entity
   */
  public get headers() {
    return this.data.blocks.Request.headers || [];
  }

  /**
   * Copies this entity to a new path
   * @param path The new path
   */
  public async copy(path: string) {
    const entity = new YasumuRestEntity(this.module, {
      ...this.data,
      blocks: {
        ...this.data.blocks,
        Metadata: {
          ...this.data.blocks.Metadata,
          id: generateId(),
          path,
          createdAt: Date.now(),
        },
      },
    });

    await entity.save();

    return entity;
  }

  /**
   * Update the http method of this entity
   * @param method The method to set
   */
  public async setMethod(method: HttpMethod) {
    this.data.blocks.Metadata.method = method;
    return this.save();
  }

  /**
   * The root index data of this entity
   */
  public createRootIndexData(): RestIndex {
    return {
      id: this.id,
      method: this.method as HttpMethod,
      name: this.name,
      path: this.path,
    };
  }

  /**
   * Create an interactive web request for this entity
   * @returns The web request
   */
  public createInteractiveWebRequest() {
    const request = this.module.workspace.webRequest.create({
      method: this.method as HttpMethod,
      url: this.url,
      headers: this.headers,
      timeout: 60_000,
    });

    return request;
  }

  /**
   * Execute this entity
   * @param options The execution options
   * @returns The execution result
   */
  public async execute(
    options: ExecutionOptions = {},
  ): Promise<ExecutionResult> {
    const request = options.request ?? this.createInteractiveWebRequest();
    const response = await request.send().catch(() => null);

    if (response) {
      this.data.blocks.Response = response.toJSON();

      await this.save().catch(Object);
    }

    return {
      response,
      postScript: {
        type: ScriptType.PostScript,
        output: [],
      },
      preScript: {
        type: ScriptType.PreScript,
        output: [],
      },
      test: {
        tests: [],
      },
    };
  }

  /**
   * Execute this entity
   * @param options The execution options
   * @returns The execution result
   */
  public async send(options: ExecutionOptions = {}): Promise<ExecutionResult> {
    return this.execute(options);
  }
}
