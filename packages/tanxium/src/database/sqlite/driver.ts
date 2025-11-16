// taken from https://github.com/mizchi/drizzle-orm/blob/256aae13b624eeb260e6530f4dd38c1308898a1f/drizzle-orm/src/node-sqlite/driver.ts
import { DatabaseSync, type DatabaseSyncOptions } from 'node:sqlite';
import {
  entityKind,
  DefaultLogger,
  createTableRelationsHelpers,
  extractTablesRelationalConfig,
  type RelationalSchemaConfig,
  type TablesRelationalConfig,
  type ExtractTablesWithRelations,
  type DrizzleConfig,
  isConfig,
} from 'drizzle-orm';
import { BaseSQLiteDatabase, SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';
import { NodeSQLiteSession } from './session.ts';
import { Buffer } from 'node:buffer';

type NodeSQLitePath = string | Buffer | URL;
type NodeSQLiteOptions = DatabaseSyncOptions;
export type DrizzleNodeSQLiteConfig =
  | ({ path: NodeSQLitePath } & NodeSQLiteOptions)
  | NodeSQLitePath
  | undefined;

export class NodeSQLiteDatabase<
  TFullSchema extends Record<string, unknown> = Record<string, never>, // Full schema definition
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>, // Relational schema derived from Full schema
> extends BaseSQLiteDatabase<
  'sync',
  { changes: number | bigint; lastInsertRowid: number | bigint },
  TFullSchema,
  TSchema
> {
  static override readonly [entityKind]: string = 'NodeSQLiteDatabase'; // Change entityKind
}

function construct<
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(
  client: DatabaseSync,
  config: DrizzleConfig<TFullSchema> = {}, // Config uses TFullSchema
): NodeSQLiteDatabase<TFullSchema, TSchema> & {
  $client: DatabaseSync;
} {
  const dialect = new SQLiteSyncDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }

  let relationalSchema: RelationalSchemaConfig<TSchema> | undefined;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers,
    );
    relationalSchema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables as TSchema,
      tableNamesMap: tablesConfig.tableNamesMap,
    };
  }
  const session = new NodeSQLiteSession<TFullSchema, TSchema>(
    client,
    dialect,
    relationalSchema,
    { logger },
  );
  const db = new NodeSQLiteDatabase<TFullSchema, TSchema>(
    'sync',
    dialect,
    session,
    relationalSchema,
  );
  // deno-lint-ignore no-explicit-any
  (<any>db).$client = client;

  return db as unknown as NodeSQLiteDatabase<TFullSchema, TSchema> & {
    $client: DatabaseSync;
  };
}

export function drizzle<
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends
    TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
>(
  ...params:
    | []
    | [DatabaseSync | NodeSQLitePath]
    | [DatabaseSync | NodeSQLitePath, DrizzleConfig<TFullSchema>]
    | [
        DrizzleConfig<TFullSchema> &
          (
            | {
                connection?: DrizzleNodeSQLiteConfig;
              }
            | {
                client: DatabaseSync;
              }
          ),
      ]
): NodeSQLiteDatabase<TFullSchema, TSchema> & {
  $client: DatabaseSync;
} {
  if (
    params[0] === undefined ||
    typeof params[0] === 'string' ||
    params[0] instanceof Buffer ||
    params[0] instanceof URL
  ) {
    // deno-lint-ignore no-explicit-any
    const dbPath = (params[0] as any) ?? ':memory:';
    const instance = new DatabaseSync(dbPath);
    return construct(instance, params[1]);
  }

  if (isConfig(params[0])) {
    const { connection, client, ...drizzleConfig } = params[0] as {
      connection?: DrizzleNodeSQLiteConfig;
      client?: DatabaseSync;
    } & DrizzleConfig<TFullSchema>;
    if (client) return construct(client, drizzleConfig);

    if (connection && typeof connection === 'object' && 'path' in connection) {
      const { path, ...options } = connection;
      return construct(
        new DatabaseSync((path ?? ':memory:') as string, options),
        drizzleConfig,
      );
    } else {
      return construct(
        new DatabaseSync((connection ?? ':memory:') as string),
        drizzleConfig,
      );
    }
  }

  return construct(
    params[0] as DatabaseSync,
    params[1] as DrizzleConfig<TFullSchema> | undefined,
  );
}

// deno-lint-ignore no-namespace
export namespace drizzle {
  export function mock<
    TFullSchema extends Record<string, unknown> = Record<string, never>,
    TSchema extends
      TablesRelationalConfig = ExtractTablesWithRelations<TFullSchema>,
  >(
    config?: DrizzleConfig<TFullSchema>,
  ): NodeSQLiteDatabase<TFullSchema, TSchema> & {
    $client: '$client is not available on drizzle.mock()';
  } {
    // deno-lint-ignore no-explicit-any
    return construct({} as any, config) as any;
  }
}
