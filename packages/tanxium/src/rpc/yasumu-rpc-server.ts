import { defineRpcCommandHandler } from '@yasumu/rpc';
import { db } from '../database/index.ts';
import { rest } from '../database/schema/tables/rest.ts';
import { RestEntityData, WorkspaceData } from '@yasumu/common';
import {
  RequestBody,
  restEntities,
  RestEntityMetadata,
  workspaces,
  YasumuEmbeddedScript,
} from '../database/schema.ts';
import { and, eq } from 'drizzle-orm';

export const yasumuRpcServer = defineRpcCommandHandler({
  'rest.create': {
    type: 'mutation',
    handler: async (ctx, data) => {
      const [restModule] = await db
        .select()
        .from(rest)
        .where(eq(rest.workspaceId, ctx.workspaceId!));

      const result = await db
        .insert(restEntities)
        .values({
          restId: restModule.id,
          name: data.name,
          method: data.method,
          url: data.url,
          metadata: data.metadata as unknown as RestEntityMetadata,
          requestBody: null as unknown as RequestBody,
          requestHeaders: [],
          testScript: null as unknown as YasumuEmbeddedScript,
          script: null as unknown as YasumuEmbeddedScript,
          requestParameters: [],
        })
        .returning();

      return result[0] as unknown as RestEntityData;
    },
  },
  'rest.get': {
    type: 'query',
    handler: async (ctx, id) => {
      const [restModule] = await db
        .select()
        .from(rest)
        .where(eq(rest.workspaceId, ctx.workspaceId!));

      const [restEntity] = await db
        .select()
        .from(restEntities)
        .where(
          and(eq(restEntities.restId, restModule.id), eq(restEntities.id, id)),
        );

      if (!restEntity) {
        throw new Error('Rest entity not found');
      }

      return restEntity as unknown as RestEntityData;
    },
  },
  'rest.list': {
    type: 'query',
    handler: async (ctx) => {
      const [restModule] = await db
        .select()
        .from(rest)
        .where(eq(rest.workspaceId, ctx.workspaceId!));

      const result = await db
        .select()
        .from(restEntities)
        .where(eq(restEntities.restId, restModule.id));

      return result as unknown as RestEntityData[];
    },
  },
  'workspaces.create': {
    type: 'mutation',
    handler: async (_, data) => {
      const result = await db
        .insert(workspaces)
        .values({
          name: data.name,
          metadata: {
            path: data.metadata.path as string,
          },
        })
        .returning();

      return result[0] as unknown as WorkspaceData;
    },
  },
  'workspaces.get': {
    type: 'query',
    handler: async (_, id) => {
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, id));

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      return workspace as unknown as WorkspaceData;
    },
  },
  'workspaces.list': {
    type: 'query',
    handler: async () => {
      const result = await db.select().from(workspaces);
      return result as unknown as WorkspaceData[];
    },
  },
});
