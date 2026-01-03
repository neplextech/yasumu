/// <reference types="yasumu:types" />

// run migrations
async function runMigrations() {
  try {
    // dynamically import dependencies
    // to avoid instantiating the server before migrations are run
    const { join } = await import('node:path');
    const { migrate } = await import('./database/sqlite/migrator.ts');
    const { db } = await import('./database/index.ts');

    const migrationsFolder = join(Yasumu.getServerEntrypoint(), 'drizzle');
    console.log(`Migrations folder: ${migrationsFolder}`);
    await migrate(db, {
      migrationsFolder,
    });
    console.log('Migrations completed');
  } catch (error) {
    const err = Error.isError(error) ? error.stack : null;
    throw new Error(`Database migration failed:\n\n${err || error}`, {
      cause: error,
    });
  }
}

// entrypoint
export async function startServer() {
  await runMigrations();

  // dynamically import the server
  // to avoid instantiating the server before migrations are run
  const { app } = await import('./backend/server.ts');
  const { rpcServer } = await import('./rpc/rpc-server.ts');
  const { echoServer } = await import('./echo-server/server.ts');

  const server = Deno.serve({ port: 0 }, app.fetch);
  Yasumu.setRpcPort(server.addr.port);

  const echoServerResult = await Deno.serve({ port: 0 }, echoServer.fetch);
  Yasumu.setEchoServerPort(echoServerResult.addr.port);

  console.log(
    `Tanxium server started on port http://${server.addr.hostname}:${server.addr.port}`,
  );

  return {
    app,
    server,
    rpcServer,
  };
}

export type { AppType } from './backend/server.ts';
