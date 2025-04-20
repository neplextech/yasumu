import {
  createStandalone,
  type YasumuStandaloneFormat,
} from '@/standalone/types.js';
import { ExternalCollectionsProvider } from '../base/ExternalCollectionsProvider.js';
import type { InsomniaCollection } from './types.js';
import {
  WorkspaceModuleType,
  type GraphqlIndex,
  type RestIndex,
} from '@/modules/index.js';
import { YASUMU_WORKSPACE_ANNOTATION } from '@/common/constants.js';
import { GraphqlHttpMethod, HttpMethod } from '@yasumu/common';
import { generateId } from '@/common/utils.js';
import type { GraphqlEntitySchemaType } from '@/schema/GraphqlEntitySchema.js';
import type { RestEntitySchemaType } from '@/schema/RestEntitySchema.js';

export class Insomnia extends ExternalCollectionsProvider<InsomniaCollection> {
  public async export(): Promise<InsomniaCollection> {
    const resources: InsomniaCollection['resources'] = [];

    const workspace = this.workspace.getMetadata().getRawData();

    // @ts-expect-error
    resources.push({
      _id: `wrk_${workspace.blocks.Metadata.id}`,
      _type: 'workspace',
      scope: 'collection',
      description: '',
      name: workspace.blocks.Metadata.name,
      modified: Date.now(),
      created: workspace.blocks.Metadata.createdAt,
      parentId: null,
    });

    const restEntities = await this.workspace.rest.getRawEntities();
    const graphqlEntities = await this.workspace.graphql.getRawEntities();

    for (const entity of restEntities) {
      // @ts-expect-error
      resources.push({
        _id: `req_${entity.blocks.Metadata.id}`,
        _type: 'request',
        parentId: `wrk_${workspace.blocks.Metadata.id}`,
        modified: Date.now(),
        created: entity.blocks.Metadata.createdAt,
        name: entity.blocks.Metadata.name,
        method: entity.blocks.Metadata.method,
        url: entity.blocks.Request.url,
        headers: entity.blocks.Request.headers.map((h) => ({
          name: h.key,
          value: h.value,
        })),
        body: {
          mimeType: 'application/json',
          text: '',
        },
        parameters: [],
        authentication: {},
        metaSortKey: -Date.now(),
        isPrivate: false,
        pathParameters: [],
        settingStoreCookies: true,
        settingSendCookies: true,
        settingDisableRenderRequestBody: false,
        settingEncodeUrl: true,
        settingRebuildPath: true,
        settingFollowRedirects: 'global',
      });
    }

    for (const entity of graphqlEntities) {
      // @ts-expect-error
      resources.push({
        _id: `req_${entity.blocks.Metadata.id}`,
        _type: 'request',
        parentId: `wrk_${workspace.blocks.Metadata.id}`,
        modified: Date.now(),
        created: entity.blocks.Metadata.createdAt,
        name: entity.blocks.Metadata.name,
        method: entity.blocks.Metadata.method,
        url: entity.blocks.Request.url,
        headers: entity.blocks.Request.headers.map((h) => ({
          name: h.key,
          value: h.value,
        })),
        body: {
          mimeType: 'application/graphql',
          text: (entity.blocks.Request.body as string) ?? '',
        },
        parameters: [],
        authentication: {},
        metaSortKey: -Date.now(),
        isPrivate: false,
        pathParameters: [],
        settingStoreCookies: true,
        settingSendCookies: true,
        settingDisableRenderRequestBody: false,
        settingEncodeUrl: true,
        settingRebuildPath: true,
        settingFollowRedirects: 'global',
      });
    }

    return {
      __export_date: new Date().toString(),
      __export_source: 'insomnia.desktop.app:v10.0.0',
      __export_format: 4,
      _type: 'export',
      resources,
    };
  }

  public async import(
    data: InsomniaCollection,
  ): Promise<YasumuStandaloneFormat> {
    if (
      !('__export_source' in data) ||
      !data.__export_source.startsWith('insomnia')
    ) {
      throw new Error('Invalid insomnia collection');
    }

    const workspace = data.resources.find((r) => r._type === 'workspace');

    if (!workspace) {
      throw new Error('Invalid insomnia collection, workspace was not found');
    }

    const graphqlQueries = data.resources
      .filter(
        (r) =>
          r._type === 'request' &&
          r.headers?.some(
            (h) =>
              h.name === 'Content-Type' && h.value === 'application/graphql',
          ),
      )
      .map((r) => {
        return {
          annotation: WorkspaceModuleType.GraphQL,
          blocks: {
            AfterResponse: '',
            BeforeRequest: '',
            Metadata: {
              createdAt: r.created,
              id: generateId(),
              method: (r.method as GraphqlHttpMethod) ?? GraphqlHttpMethod.Post,
              name: r.name,
              path: '/',
            },
            Request: {
              body: r.body?.text ?? '',
              headers:
                r.headers?.map((h) => ({
                  key: h.name,
                  value: h.value,
                })) ?? [],
              url: r.url ?? '',
              variables: {},
            },
            Response: {
              body: '',
              headers: [],
              size: null,
              time: null,
            },
            Test: '',
          },
        } satisfies GraphqlEntitySchemaType;
      });

    const httpRequests = data.resources
      .filter(
        (r) =>
          r._type === 'request' &&
          r.headers?.some(
            (h) =>
              h.name === 'Content-Type' && h.value !== 'application/graphql',
          ),
      )
      .map((r) => {
        return {
          annotation: WorkspaceModuleType.Rest,
          blocks: {
            AfterResponse: '',
            BeforeRequest: '',
            Metadata: {
              createdAt: r.created,
              id: generateId(),
              method: (r.method as HttpMethod) ?? HttpMethod.Get,
              name: r.name,
              path: '/',
            },
            Request: {
              headers:
                r.headers?.map((h) => ({ key: h.name, value: h.value })) ?? [],
              url: r.url ?? '',
              body: r.body?.text ?? null,
            },
            Response: {
              body: '',
              headers: [],
              size: null,
              time: null,
              status: null,
            },
            Test: '',
          },
        } satisfies RestEntitySchemaType;
      });

    return createStandalone({
      workspace: {
        annotation: YASUMU_WORKSPACE_ANNOTATION,
        blocks: {
          Metadata: {
            createdAt: workspace.created,
            id: generateId(),
            name: workspace.name,
            version: '',
          },
          Environment: {
            selectedEnvironment: '',
            environments: {},
          },
          Rest: {
            entities: httpRequests.reduce(
              (acc, r) => {
                const idx = {
                  id: r.blocks.Metadata.id,
                  method: r.blocks.Metadata.method,
                  name: r.blocks.Metadata.name,
                  path: '/',
                } satisfies RestIndex;

                acc[r.blocks.Metadata.id] = idx;

                return acc;
              },
              {} as Record<string, RestIndex>,
            ),
          },
          GraphQL: {
            entities: graphqlQueries.reduce(
              (acc, q) => {
                const idx = {
                  id: q.blocks.Metadata.id,
                  method: q.blocks.Metadata.method,
                  name: q.blocks.Metadata.name,
                  path: '/',
                } satisfies GraphqlIndex;

                acc[q.blocks.Metadata.id] = idx;

                return acc;
              },
              {} as Record<string, GraphqlIndex>,
            ),
          },
          SMTP: {
            entities: {},
          },
          SocketIO: {
            entities: {},
          },
          SSE: {
            entities: {},
          },
          WebSocket: {
            entities: {},
          },
        },
      },
      entities: {
        [WorkspaceModuleType.GraphQL]: {
          indexes: {
            '/': graphqlQueries.reduce(
              (acc, q) => {
                acc[q.blocks.Metadata.id] = q.blocks.Metadata.name;
                return acc;
              },
              {} as Record<string, string>,
            ),
          },
          entities: graphqlQueries.reduce(
            (acc, q) => {
              acc[q.blocks.Metadata.id] = q;
              return acc;
            },
            {} as Record<string, GraphqlEntitySchemaType>,
          ),
        },
        [WorkspaceModuleType.Rest]: {
          indexes: {
            '/': graphqlQueries.reduce(
              (acc, q) => {
                acc[q.blocks.Metadata.id] = q.blocks.Metadata.name;
                return acc;
              },
              {} as Record<string, string>,
            ),
          },
          entities: httpRequests.reduce(
            (acc, r) => {
              acc[r.blocks.Metadata.id] = r;
              return acc;
            },
            {} as Record<string, RestEntitySchemaType>,
          ),
        },
      },
    });
  }
}
