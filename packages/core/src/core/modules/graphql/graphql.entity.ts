import type { GraphqlModule } from './graphql.js';
import type {
  HttpMethod,
  GraphqlEntityData,
  GraphqlEntityUpdateOptions,
  GraphqlScriptContext,
} from '@yasumu/common';

export class GraphqlEntity {
  public constructor(
    public readonly graphql: GraphqlModule,
    public data: GraphqlEntityData,
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

  public async update(
    data: Partial<GraphqlEntityUpdateOptions>,
  ): Promise<this> {
    const result = await this.graphql.update(this.id, data);
    Object.assign(this.data, result);
    return this;
  }

  public delete(): Promise<void> {
    return this.graphql.delete(this.id);
  }

  public getFullURL() {
    if (!this.data.url) {
      return null;
    }

    const searchParameters = new URLSearchParams(
      (this.data.searchParameters || [])
        .filter((p) => p.enabled)
        .map((parameter) => [parameter.key, parameter.value]),
    );

    const url = new URL(this.data.url);

    url.search = searchParameters.toString();

    const stringifiedUrl = url
      .toString()
      .replace(/\:([a-zA-Z0-9_]+)/g, (match, key) => {
        const parameter = this.data.requestParameters?.find(
          (p) => p.key === key && p.enabled,
        );

        return parameter?.value ?? match;
      });

    return stringifiedUrl;
  }

  public async executePreRequestScript(context: GraphqlScriptContext) {
    return this.graphql.executeScript(this.id, this.data.script, context);
  }

  public toJSON(): GraphqlEntityData {
    return this.data;
  }
}
