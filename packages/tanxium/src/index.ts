/// <reference types="../../../apps/yasumu/src-tauri/src/tanxium/runtime/bootstrap.ts" />
// import { prisma } from './database/index.ts';
// import { migrateDatabase } from './database/migration.ts';
import { app } from './backend/server.ts';

export async function startServer() {
  // const wasMigrated = await migrateDatabase(prisma);

  // if (!wasMigrated) {
  //   throw new Error('Failed to migrate database');
  // }

  const server = Deno.serve({ port: 0 }, app.fetch);

  Yasumu.setRpcPort(server.addr.port);

  setTimeout(() => {
    console.log(`Tanxium server started on port ${server.addr.port}`);
  }, 5000);
}
