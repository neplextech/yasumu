import { join } from 'path';
import {
  defineRpcCommandHandler,
  type RestEntityData,
  type WorkspaceData,
} from '../src/index.ts';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(join(import.meta.dirname, 'test.db'));

db.exec(/* sql */ `CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY NOT NULL,
  createdAt TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  updatedAt TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  metadata TEXT DEFAULT '{}',
  name TEXT NOT NULL,
  variables TEXT
)`);

db.exec(/* sql */ `CREATE TABLE IF NOT EXISTS rest (
  id TEXT PRIMARY KEY NOT NULL,
  createdAt TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  updatedAt TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  metadata TEXT DEFAULT '{}',
  workspaceId TEXT NOT NULL,
  name TEXT NOT NULL,
  method TEXT NOT NULL,
  url TEXT,
  requestParameters TEXT DEFAULT '{}',
  requestHeaders TEXT DEFAULT '{}',
  requestBody TEXT DEFAULT '{}',
  script TEXT DEFAULT '{}',
  testScript TEXT DEFAULT '{}'
)`);

const createWorkspace = db.prepare(
  /* sql */ `INSERT INTO workspaces (id, name, metadata) VALUES (?, ?, ?)`,
);

const getWorkspace = db.prepare(
  /* sql */ `SELECT * FROM workspaces WHERE id = ?`,
);

const listWorkspaces = db.prepare(/* sql */ `SELECT * FROM workspaces`);

const createRest = db.prepare(
  /* sql */ `INSERT INTO rest (id, workspaceId, name, method, url, metadata) VALUES (?, ?, ?, ?, ?, ?)`,
);

const getRest = db.prepare(
  /* sql */ `SELECT * FROM rest WHERE id = ? AND workspaceId = ?`,
);

const listRests = db.prepare(
  /* sql */ `SELECT * FROM rest WHERE workspaceId = ?`,
);

const assertFound = <T>(value: T | undefined): T => {
  if (!value) {
    throw new Error('Not found');
  }

  return value;
};

export const server = defineRpcCommandHandler({
  'workspaces.create': {
    type: 'mutation',
    handler: async (ctx, data) => {
      const id = crypto.randomUUID();
      createWorkspace.run(id, data.name, JSON.stringify(data.metadata));
      return assertFound(getWorkspace.get(id) as unknown as WorkspaceData);
    },
  },
  'workspaces.get': {
    type: 'query',
    handler: async (ctx, id) => {
      const data = getWorkspace.get(id) as unknown as WorkspaceData | undefined;
      if (data) {
        data.metadata = JSON.parse(data.metadata as unknown as string);
      }
      return assertFound(data);
    },
  },
  'workspaces.list': {
    type: 'query',
    handler: async () => {
      const data = listWorkspaces.all() as unknown as WorkspaceData[];
      return data.map((data) => {
        data.metadata = JSON.parse(data.metadata as unknown as string);
        return data;
      });
    },
  },
  'rest.create': {
    type: 'mutation',
    handler: async (ctx, data) => {
      const id = crypto.randomUUID();
      createRest.run(
        id,
        ctx.workspaceId,
        data.name,
        data.method,
        data.url,
        JSON.stringify(data.metadata),
      );
      return assertFound(
        getRest.get(id, ctx.workspaceId) as unknown as RestEntityData,
      );
    },
  },
  'rest.get': {
    type: 'query',
    handler: async (ctx, id) => {
      return assertFound(
        getRest.get(id, ctx.workspaceId) as unknown as RestEntityData,
      );
    },
  },
  'rest.list': {
    type: 'query',
    handler: async (ctx) => {
      return listRests.all(ctx.workspaceId) as unknown as RestEntityData[];
    },
  },
});
