import type { OnRequestLifecycle } from '../common/types.js';
import type { RestModule } from './rest.js';
import type { RestEntityData } from '@yasumu/common';

export class RestEntity implements OnRequestLifecycle {
  public constructor(
    public readonly rest: RestModule,
    private readonly data: RestEntityData,
  ) {}

  public get id() {
    return this.data.id;
  }

  public get name() {
    return this.data.name;
  }

  public get url() {
    return this.data.url;
  }

  public get method() {
    return this.data.method;
  }

  public getSearchParameters() {
    return new URLSearchParams(
      this.data.parameters.map((parameter) => [parameter.key, parameter.value]),
    );
  }

  public getFullURL() {
    if (!this.data.url) {
      return null;
    }

    const searchParameters = this.getSearchParameters();
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
