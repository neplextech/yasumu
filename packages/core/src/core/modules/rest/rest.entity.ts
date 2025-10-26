import type { RestModule } from './rest.js';
import type { RestEntityData } from './types.js';

export class RestEntity {
  public constructor(
    public readonly rest: RestModule,
    private readonly data: RestEntityData,
  ) {}

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
