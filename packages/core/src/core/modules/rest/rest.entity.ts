import type { OnRequestLifecycle } from '../common/types.js';
import type { RestModule } from './rest.js';
import type { RestEntityData } from './types.js';

export class RestEntity implements OnRequestLifecycle {
  public constructor(
    public readonly rest: RestModule,
    private readonly data: RestEntityData,
  ) {}

  public get url() {
    return this.data.url;
  }

  public getSearchParameters() {
    return new URLSearchParams(this.data.searchParameters);
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

  public async onPostResponse(): Promise<void> {}

  public async onPreRequest(): Promise<void> {}

  public async execute() {
    await this.onPreRequest();

    // TODO

    await this.onPostResponse();
  }

  public toJSON(): RestEntityData {
    return this.data;
  }
}
