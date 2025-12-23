import type { RestModule } from './rest.js';
import type {
  HttpMethod,
  RestEntityData,
  RestEntityExecutionResult,
  RestEntityUpdateOptions,
} from '@yasumu/common';

export class RestEntity {
  public constructor(
    public readonly rest: RestModule,
    public data: RestEntityData,
  ) {}

  public get id() {
    return this.data.id;
  }

  public get name() {
    return this.data.name;
  }

  public async setName(name: string): Promise<this> {
    return this.update({ name });
  }

  public get url() {
    return this.data.url;
  }

  public async setUrl(url: string): Promise<this> {
    return this.update({ url });
  }

  public get method() {
    return this.data.method;
  }

  public async setMethod(method: HttpMethod): Promise<this> {
    return this.update({ method });
  }

  public async update(data: Partial<RestEntityUpdateOptions>): Promise<this> {
    const result = await this.rest.update(this.id, data);
    Object.assign(this.data, result);
    return this;
  }

  public delete(): Promise<void> {
    return this.rest.delete(this.id);
  }

  public getSearchParameters() {
    return new URLSearchParams(
      (this.data.parameters || []).map((parameter) => [
        parameter.key,
        parameter.value,
      ]),
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

  public async execute(): Promise<RestEntityExecutionResult> {
    const result = await this.rest.executeById(this.id);
    return result;
  }

  public toJSON(): RestEntityData {
    return this.data;
  }
}
