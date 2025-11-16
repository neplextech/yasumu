/// <reference types="yasumu:types" />
import { join } from 'node:path';
import { app } from './backend/server.ts';
import { db } from './database/index.ts';
import { migrate } from './database/sqlite/migrator.ts';

export async function startServer() {
  try {
    const migrationsFolder = join(Yasumu.getServerEntrypoint(), 'drizzle');
    console.log(`Migrations folder: ${migrationsFolder}`);
    await migrate(db, {
      migrationsFolder,
    });
  } catch (error) {
    const err = Error.isError(error) ? error.stack : null;
    throw new Error(`Database migration failed:\n\n${err || error}`, {
      cause: error,
    });
  }
  const server = Deno.serve({ port: 0 }, app.fetch);

  Yasumu.setRpcPort(server.addr.port);

  setTimeout(() => {
    console.log(
      `Tanxium server started on port http://${server.addr.hostname}:${server.addr.port}`,
    );
  }, 5000);
}

export type { AppType } from './backend/server.ts';
