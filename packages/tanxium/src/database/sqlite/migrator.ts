// taken from https://github.com/mizchi/drizzle-orm/blob/256aae13b624eeb260e6530f4dd38c1308898a1f/drizzle-orm/src/node-sqlite/migrator.ts
import type { MigrationConfig, MigrationMeta } from 'drizzle-orm/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import type { NodeSQLiteDatabase } from './driver.ts';
import { TablesRelationalConfig } from 'drizzle-orm/relations';
import { sql } from 'drizzle-orm';
import { NodeSQLiteSession } from './session.ts';

// probably .setReturnArrays or something needs to be set to get the original behavior
// but for now this patch works
function migratePatch(
  migrations: MigrationMeta[],
  session: NodeSQLiteSession<Record<string, unknown>, TablesRelationalConfig>,
  config?: string | MigrationConfig,
): void {
  const migrationsTable =
    config === undefined
      ? '__drizzle_migrations'
      : typeof config === 'string'
        ? '__drizzle_migrations'
        : (config.migrationsTable ?? '__drizzle_migrations');

  const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
  session.run(migrationTableCreate);

  const [dbMigrationsValue] = session.values(
    sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`,
  ) as unknown as [
    {
      id: number;
      hash: string;
      created_at: number;
    },
  ];

  const dbMigrations: [number, string, string][] = dbMigrationsValue
    ? Array.isArray(dbMigrationsValue)
      ? dbMigrationsValue
      : [
          [
            dbMigrationsValue.id,
            dbMigrationsValue.hash,
            dbMigrationsValue.created_at.toString(),
          ],
        ]
    : [];

  const lastDbMigration = dbMigrations[0] ?? undefined;
  session.run(sql`BEGIN`);

  try {
    for (const migration of migrations) {
      if (
        !lastDbMigration ||
        Number(lastDbMigration[2])! < migration.folderMillis
      ) {
        for (const stmt of migration.sql) {
          session.run(sql.raw(stmt));
        }
        session.run(
          sql`INSERT INTO ${sql.identifier(
            migrationsTable,
          )} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`,
        );
      }
    }

    session.run(sql`COMMIT`);
  } catch (e) {
    session.run(sql`ROLLBACK`);
    throw e;
  }
}

export async function migrate<TSchema extends Record<string, unknown>>(
  db: NodeSQLiteDatabase<TSchema>,
  config: MigrationConfig,
) {
  // @ts-ignore private api
  db.dialect.migrate = migratePatch;
  const migrations = readMigrationFiles(config);

  // @ts-expect-error types
  await db.dialect.migrate(migrations, db.session, config);
}
