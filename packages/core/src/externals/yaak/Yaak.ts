import {
  createStandalone,
  type YasumuStandaloneFormat,
} from '@/standalone/types.js';
import { ExternalCollectionsProvider } from '../base/ExternalCollectionsProvider.js';
import type { YaakCollection } from './types.js';
import { YASUMU_WORKSPACE_ANNOTATION } from '@/common/constants.js';
import {
  WorkspaceModuleType,
  type GraphqlIndex,
  type RestIndex,
} from '@/modules/index.js';
import type { GraphqlHttpMethod, HttpMethod } from '@yasumu/common';
import type { RestEntitySchemaType } from '@/schema/RestEntitySchema.js';
import type { GraphqlEntitySchemaType } from '@/schema/GraphqlEntitySchema.js';

const schema = 2;
const YAAK_VERSION = '2024.11.5';

export class Yaak extends ExternalCollectionsProvider<YaakCollection> {
  public async export(): Promise<YaakCollection> {
    const metadata = this.workspace.getMetadata().getRawData();
    const httpRequests = await this.workspace.rest.getEntities();
    const graphqlQueries = await this.workspace.graphql.getEntities();

    return {
      yaakSchema: schema,
      timestamp: new Date().toString(),
      yaakVersion: YAAK_VERSION,
      resources: {
        workspaces: [
          {
            createdAt: new Date(metadata.blocks.Metadata.createdAt).toString(),
            description: '',
            id: metadata.blocks.Metadata.id,
            model: 'workspace',
            name: metadata.blocks.Metadata.name,
            settingFollowRedirects: true,
            settingRequestTimeout: 0,
            settingValidateCertificates: true,
            updatedAt: new Date().toString(),
            variables: [],
          },
        ],
        httpRequests: httpRequests
          .map((r, i) => {
            return {
              authentication: {},
              authenticationType: null,
              body: {},
              createdAt: r.createdAt.toString(),
              folderId: null,
              headers: r.headers.map((h) => ({
                enabled: true,
                name: h.key,
                value: h.value,
              })),
              method: r.method,
              name: r.name,
              model: 'http_request',
              url: r.url,
              urlParameters: [],
              id: r.id,
              sortPriority: i,
              updatedAt: new Date().toString(),
              workspaceId: metadata.blocks.Metadata.id,
              bodyType: 'application/json',
            };
          })
          .concat(
            graphqlQueries.map((r, i) => {
              return {
                authentication: {},
                authenticationType: null,
                body: {
                  query: r.data.blocks.Request.body || '',
                  variables: '',
                },
                createdAt: r.createdAt.toString(),
                folderId: null,
                headers: r.headers.map((h) => ({
                  enabled: true,
                  name: h.key,
                  value: h.value,
                })),
                method: r.method,
                name: r.name,
                model: 'http_request',
                url: r.url,
                urlParameters: [],
                id: r.id,
                sortPriority: i,
                updatedAt: new Date().toString(),
                workspaceId: metadata.blocks.Metadata.id,
                bodyType: 'graphql',
              };
            }),
          ),
        environments: [],
        folders: [],
        grpcRequests: [],
      },
    } satisfies YaakCollection;
  }

  public async import(data: YaakCollection): Promise<YasumuStandaloneFormat> {
    if (data.yaakSchema !== schema)
      throw new Error(
        'Unsupported Yaak schema. Currently only schema 2 is supported.',
      );

    const workspace = data.resources.workspaces[0];

    if (!workspace) throw new Error('No workspace found in Yaak collection.');

    const httpRequests = data.resources.httpRequests
      .filter((r) => r.workspaceId === workspace.id && r.bodyType !== 'graphql')
      .map((r) => {
        return {
          annotation: WorkspaceModuleType.Rest,
          blocks: {
            Metadata: {
              createdAt: new Date(r.createdAt).getTime(),
              id: r.id,
              method: r.method as HttpMethod,
              name: r.name,
              path: '/',
            },
            Request: {
              headers: r.headers.map((h) => ({ key: h.name, value: h.value })),
              url: r.url,
              body: r.body?.text || null,
            },
            Response: {
              body: '',
              headers: [],
              size: null,
              time: null,
              status: null,
            },
            AfterResponse: '',
            BeforeRequest: '',
            Test: '',
          },
        } satisfies RestEntitySchemaType;
      });

    const graphqlQueries = data.resources.httpRequests
      .filter((r) => r.workspaceId === workspace.id && r.bodyType === 'graphql')
      .map((q) => {
        return {
          annotation: WorkspaceModuleType.GraphQL,
          blocks: {
            Metadata: {
              createdAt: new Date(q.createdAt).getTime(),
              id: q.id,
              method: q.method as GraphqlHttpMethod,
              name: q.name,
              path: '/',
            },
            Request: {
              body: q.body?.query || null,
              headers: q.headers.map((h) => ({ key: h.name, value: h.value })),
              url: q.url,
              variables: {},
            },
            Response: {
              body: '',
              headers: [],
              size: null,
              time: null,
            },
            AfterResponse: '',
            BeforeRequest: '',
            Test: '',
          },
        } satisfies GraphqlEntitySchemaType;
      });

    const standalone = createStandalone({
      workspace: {
        annotation: YASUMU_WORKSPACE_ANNOTATION,
        blocks: {
          Metadata: {
            createdAt: new Date(workspace.createdAt).getTime(),
            name: workspace.name,
            id: workspace.id,
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

    return standalone;
  }
}
