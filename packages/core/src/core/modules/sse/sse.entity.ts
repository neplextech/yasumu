import type { SseEntityData, SseEntityUpdateOptions } from '@yasumu/common';

import type { SseModule } from './sse.js';

export class SseEntity {
  public constructor(
    public readonly sse: SseModule,
    public data: SseEntityData,
  ) {}

  public get id() {
    return this.data.id;
  }

  public get name() {
    return this.data.name;
  }

  public async update(data: Partial<SseEntityUpdateOptions>): Promise<this> {
    Object.assign(this.data, await this.sse.update(this.id, data));
    return this;
  }

  public delete(): Promise<void> {
    return this.sse.delete(this.id);
  }

  public toJSON(): SseEntityData {
    return this.data;
  }
}
