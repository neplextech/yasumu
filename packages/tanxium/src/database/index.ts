/// <reference types="../../../../apps/yasumu/src-tauri/src/tanxium/runtime/bootstrap.ts" />
import { join } from 'node:path';
import { PrismaClient } from '../prisma/client.ts';
import { PrismaNodeSQLite } from 'prisma-adapter-node-sqlite';

const adapter = new PrismaNodeSQLite({
  url: join(Yasumu.getResourcesDir(), 'yasumu.db'),
});

export const prisma = new PrismaClient({ adapter });
