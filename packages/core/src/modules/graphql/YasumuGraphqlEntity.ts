import { generateId } from '@/common/utils.js';
import { BaseEntity } from '../common/BaseEntity.js';
import {
  type ExecutionOptions,
  type ExecutionResult,
} from '../common/types.js';
import type { GraphqlIndex } from './types.js';
import { GraphqlHttpMethod } from '@yasumu/common';
import type { DeepPartial } from '../rest/YasumuRestEntity.js';
import type { YasumuGraphql } from './YasumuGraphql.js';
import { INTROSPECTION_QUERY, type IntrospectionQuery } from './constants.js';
import type { GraphqlEntitySchemaType } from '@/schema/GraphqlEntitySchema.js';
import * as graphql from 'graphql';

export type GraphqlVariable = Record<
  string,
  {
    key: string;
    value: GraphqlQueryVariableType;
    enabled: boolean;
  }
>;

export type GraphqlQueryVariable = Record<string, GraphqlQueryVariableType>;

export interface GraphqlQueryOptions {
  query?: string;
  operationName?: string;
  variables?: GraphqlVariable;
}

export type GraphqlQueryVariableType = string | number | boolean | null;

export class YasumuGraphqlEntity extends BaseEntity<GraphqlEntitySchemaType> {
  public data!: GraphqlEntitySchemaType;
  public introspectionData: IntrospectionQuery | null = null;

  /**
   * Construct a new rest entity
   * @param module The rest module that manages this entity
   * @param data The data of this entity
   */
  public constructor(
    public readonly module: YasumuGraphql,
    data?: DeepPartial<GraphqlEntitySchemaType>,
  ) {
    super();
    this.#reformat(data);
  }

  #reformat(data?: DeepPartial<GraphqlEntitySchemaType>) {
    if (!data || typeof data !== 'object') {
      data = {
        blocks: {},
      } as GraphqlEntitySchemaType;
    }

    data.annotation = this.module.type;
    data.blocks!.Metadata ??= {} as GraphqlIndex;
    data.blocks!.Metadata.createdAt ??= Date.now();
    data.blocks!.Metadata.id ??= generateId();
    data.blocks!.Metadata.method ??= GraphqlHttpMethod.Get;
    data.blocks!.Metadata.name ??= 'Untitled request';
    data.blocks!.Metadata.path ??= '/';
    data.blocks!.Request = {
      headers: data.blocks!.Request?.headers ?? [
        {
          key: 'Content-Type',
          value: 'application/json',
        },
      ],
      variables: this.#reformatQueryVariables(
        data.blocks!.Request?.variables ?? {},
      ),
      url: data.blocks!.Request?.url ?? '',
      body: data.blocks!.Request?.body ?? '',
    };
    data.blocks!.Response = {
      headers: data.blocks!.Response?.headers ?? [],
      body: data.blocks!.Response?.body ?? '',
      size: data.blocks!.Response?.size ?? null,
      time: data.blocks!.Response?.time ?? null,
    };
    data.blocks!.AfterResponse ??= '';
    data.blocks!.BeforeRequest ??= '';
    data.blocks!.Test ??= '';

    this.data = data as GraphqlEntitySchemaType;
  }

  #reformatQueryVariables(variables: DeepPartial<GraphqlVariable>) {
    if (!variables || typeof variables !== 'object') {
      return {};
    }

    for (const value of Object.values(variables)) {
      if (!value || typeof value !== 'object') {
        continue;
      }

      value.enabled ??= true;
    }

    return variables;
  }

  public get method() {
    return this.data.blocks.Metadata.method ?? GraphqlHttpMethod.Post;
  }

  public get url() {
    return this.data.blocks.Request.url;
  }

  public get headers() {
    return this.data.blocks.Request.headers ?? [];
  }

  public setURL(url: string) {
    this.data.blocks.Request.url = url;
  }

  public get variables() {
    return this.data.blocks.Request.variables;
  }

  public setVariables(variables: GraphqlVariable) {
    // @ts-ignore type issue
    this.data.blocks.Request.variables = Object.fromEntries(
      Object.entries(variables).map(([key, value]) => [
        key,
        { key, value, enabled: !!value.enabled },
      ]),
    );
  }

  public setVariable(
    key: string,
    value: GraphqlQueryVariableType | GraphqlVariable,
  ) {
    if (value !== null && typeof value === 'object') {
      this.data.blocks.Request.variables[key] = {
        key,
        enabled: !!value.enabled,
        value: value.value.value,
      };
    } else {
      this.data.blocks.Request.variables[key] = {
        key,
        value,
        enabled: true,
      };
    }
    return this.save();
  }

  public deleteVariable(key: string) {
    delete this.data.blocks.Request.variables[key];
    return this.save();
  }

  public getVariable(key: string) {
    return this.data.blocks.Request.variables[key];
  }

  public setQuery(query: string | FormData | null) {
    this.data.blocks.Request.body = query as string;
    return this.save();
  }

  public get query() {
    return this.data.blocks.Request.body;
  }

  public createRootIndexData(): GraphqlIndex {
    return {
      id: this.id,
      name: this.name,
      path: this.path,
      method: this.method as GraphqlHttpMethod,
    };
  }

  /**
   * Introspect the GraphQL schema
   */
  public async introspect(): Promise<IntrospectionQuery | null> {
    const response = await this.send({
      query: INTROSPECTION_QUERY,
      operationName: 'IntrospectionQuery',
      variables: undefined,
    });

    if (!response?.ok) {
      return null;
    }

    const schema = await response.json().then(
      (d) => d.data || null,
      () => null,
    );

    if (schema) {
      this.introspectionData = schema;
    }

    return schema;
  }

  public async send(
    options: GraphqlQueryOptions = {},
  ): Promise<Response | null> {
    if (!this.url) return null;

    const reqOpts = {
      query: options.query ?? (this.query as string),
      variables: this.reformatVariableTypes(
        ('variables' in options ? options.variables : this.variables) ?? {},
      ),
      operationName: options.operationName || undefined,
    };

    const { fetch } = this.module.workspace.yasumu;

    const headers = new Headers();

    for (const { key, value } of this.headers) {
      headers.append(key, value);
    }

    console.log(reqOpts, 'reqOpts');

    const opt = JSON.stringify(reqOpts);

    const init: RequestInit & { maxRedirects: number; timeout: number } = {
      method: this.method,
      headers,
      body: this.method === 'GET' ? undefined : opt,
      redirect: 'follow',
      maxRedirects: 5,
      timeout: 60_000,
      signal: AbortSignal.timeout(60_000),
    };

    const url = new URL(this.url);

    if (this.method === GraphqlHttpMethod.Get) {
      url.searchParams.append('query', opt);
    }

    return fetch(url.toString(), init);
  }

  /**
   * Reformats the given variables to the correct types based on the current graphql query
   * @param variables The variables to reformat
   */
  public reformatVariableTypes(
    variables: GraphqlVariable,
  ): GraphqlQueryVariable {
    const variablesCopy: GraphqlQueryVariable = {};
    const rawQuery = this.data.blocks.Request.body;
    if (!rawQuery) return variablesCopy;

    const schema = graphql.parse(rawQuery);

    const variableDefinitions = schema.definitions
      .filter((def) => def.kind === 'OperationDefinition')
      .flatMap((def) => def.variableDefinitions ?? []);

    for (const variableDef of variableDefinitions) {
      const name = variableDef.variable.name.value;
      const type = variableDef.type;

      if (name in variables) {
        const variable = variables[name];

        if (type.kind === 'NamedType') {
          switch (type.name.value) {
            case 'Int':
              variablesCopy[name] = Number.parseInt(variable.value as string);
              break;
            case 'Float':
              variablesCopy[name] = Number.parseFloat(variable.value as string);
              break;
            case 'Boolean':
              variablesCopy[name] =
                typeof variable.value === 'boolean'
                  ? variable.value
                  : variable.value === 'true';
              break;
            default:
              if (typeof variable !== 'string') {
                variablesCopy[name] = variable.value;
              }
              break;
          }
        }
      }
    }

    return variablesCopy;
  }

  public async execute(options?: ExecutionOptions): Promise<ExecutionResult> {
    return {} as ExecutionResult;
  }
}
