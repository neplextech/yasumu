import { YasumuEntity } from '../common/entity';
import type { RestEntityData } from './types';

export class RestEntity implements YasumuEntity {
  public readonly name = 'Rest';

  public constructor(private readonly data: RestEntityData) {}

  public get url() {
    return this.data.url;
  }

  public toJSON(): RestEntityData {
    return this.data;
  }
}
