import { YasumuEntity } from '../common/entity';
import type { RestEntityData } from './types';

export class RestEntity implements YasumuEntity {
  public readonly type = 'rest';

  public constructor(private readonly data: RestEntityData) {}

  public get url() {
    return this.data.url;
  }

  public getFullURL() {
    if (!this.data.url) {
      return null;
    }

    const searchParameters = new URLSearchParams(this.data.searchParameters);
    const url = new URL(this.data.url);

    url.search = searchParameters.toString();

    return url.toString();
  }

  public toJSON(): RestEntityData {
    return this.data;
  }
}
