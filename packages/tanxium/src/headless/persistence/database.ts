import type { DatabaseSync } from 'node:sqlite';

import type * as schema from '../../database/schema.ts';
import type { NodeSQLiteDatabase } from '../../database/sqlite/driver.ts';

export type HeadlessDrizzleDatabase = NodeSQLiteDatabase<typeof schema> & { $client: DatabaseSync };
export type HeadlessDrizzleTransaction = Parameters<Parameters<HeadlessDrizzleDatabase['transaction']>[0]>[0];
export type HeadlessDrizzleConnection = HeadlessDrizzleDatabase | HeadlessDrizzleTransaction;
