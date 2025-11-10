// taken from https://github.com/mizchi/drizzle-orm/blob/256aae13b624eeb260e6530f4dd38c1308898a1f/drizzle-orm/src/node-sqlite/migrator.ts
import type { MigrationConfig } from 'drizzle-orm/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import type { NodeSQLiteDatabase } from './driver.ts';

export function migrate<TSchema extends Record<string, unknown>>(
  db: NodeSQLiteDatabase<TSchema>,
  config: MigrationConfig,
) {
  const migrations = readMigrationFiles(config);
  // @ts-expect-error types
  db.dialect.migrate(migrations, db.session, config);
}
