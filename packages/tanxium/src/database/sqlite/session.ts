// taken from https://github.com/mizchi/drizzle-orm/blob/256aae13b624eeb260e6530f4dd38c1308898a1f/drizzle-orm/src/node-sqlite/session.ts
import type { DatabaseSync, StatementSync } from 'node:sqlite';
import {
  entityKind,
  type Logger,
  NoopLogger,
  fillPlaceholders,
  type Query,
  sql,
  type RelationalSchemaConfig,
  type TablesRelationalConfig,
} from 'drizzle-orm';
import type {
  SQLiteSyncDialect,
  SelectedFieldsOrdered,
  PreparedQueryConfig as PreparedQueryConfigBase,
  SQLiteExecuteMethod,
  SQLiteTransactionConfig,
} from 'drizzle-orm/sqlite-core';
import {
  SQLiteTransaction,
  SQLitePreparedQuery as PreparedQueryBase,
  SQLiteSession,
} from 'drizzle-orm/sqlite-core';
// @ts-ignore private api
import { mapResultRow } from 'drizzle-orm/utils';

export interface NodeSQLiteSessionOptions {
  logger?: Logger;
}

type NodeRunResult = {
  changes: number | bigint;
  lastInsertRowid: number | bigint;
};

type PreparedQueryConfig = Omit<PreparedQueryConfigBase, 'statement' | 'run'>;

export class NodeSQLiteSession<
  TFullSchema extends Record<string, unknown>,
  TSchema extends TablesRelationalConfig,
> extends SQLiteSession<'sync', NodeRunResult, TFullSchema, TSchema> {
  static override readonly [entityKind]: string = 'NodeSQLiteSession';
  private logger: Logger;
  constructor(
    private client: DatabaseSync,
    dialect: SQLiteSyncDialect,
    private schema: RelationalSchemaConfig<TSchema> | undefined,
    options: NodeSQLiteSessionOptions = {},
  ) {
    super(dialect);
    this.logger = options.logger ?? new NoopLogger();
  }

  prepareQuery<T extends Omit<PreparedQueryConfig, 'run'>>(
    query: Query,
    fields: SelectedFieldsOrdered | undefined,
    executeMethod: SQLiteExecuteMethod,
    isResponseInArrayMode: boolean,
    customResultMapper?: (rows: unknown[][]) => unknown,
  ): NodeSQLitePreparedQuery<T> {
    const stmt: StatementSync = this.client.prepare(query.sql);
    return new NodeSQLitePreparedQuery(
      stmt,
      query,
      this.logger,
      fields,
      executeMethod,
      isResponseInArrayMode,
      customResultMapper,
    );
  }

  override transaction<T>(
    transaction: (tx: NodeSQLiteTransaction<TFullSchema, TSchema>) => T,
    config: SQLiteTransactionConfig = {},
  ): T {
    const behavior = config.behavior ?? 'deferred';
    this.client.exec(`begin ${behavior}`);
    const tx = new NodeSQLiteTransaction(
      'sync',
      // @ts-expect-error types
      this.dialect,
      this,
      this.schema,
    );
    try {
      const result = transaction(tx);
      this.client.exec('commit');
      return result;
    } catch (err) {
      this.client.exec('rollback');
      throw err;
    }
  }
}

export class NodeSQLiteTransaction<
  TFullSchema extends Record<string, unknown>,
  TSchema extends TablesRelationalConfig,
> extends SQLiteTransaction<'sync', NodeRunResult, TFullSchema, TSchema> {
  static override readonly [entityKind]: string = 'NodeSQLiteTransaction';
  override transaction<T>(
    transaction: (tx: NodeSQLiteTransaction<TFullSchema, TSchema>) => T,
  ): T {
    const savepointName = `sp${this.nestedIndex}`;
    const tx = new NodeSQLiteTransaction(
      'sync',
      // @ts-expect-error types
      this.dialect,
      // @ts-expect-error types
      this.session,
      this.schema,
      this.nestedIndex + 1,
    );
    // @ts-expect-error types
    this.session.run(sql.raw(`savepoint ${savepointName}`));
    try {
      // @ts-expect-error types
      const result = transaction(tx);
      // @ts-expect-error types
      this.session.run(sql.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      // @ts-expect-error types
      this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
}

export class NodeSQLitePreparedQuery<
  T extends PreparedQueryConfig = PreparedQueryConfig,
> extends PreparedQueryBase<{
  type: 'sync';
  run: NodeRunResult;
  all: T['all'];
  get: T['get'];
  values: T['values'];
  execute: T['execute'];
}> {
  static override readonly [entityKind]: string = 'NodeSQLitePreparedQuery';

  constructor(
    private stmt: StatementSync,
    query: Query,
    private logger: Logger,
    private fields: SelectedFieldsOrdered | undefined,
    executeMethod: SQLiteExecuteMethod,
    private _isResponseInArrayMode: boolean,
    private customResultMapper?: (rows: unknown[][]) => unknown,
  ) {
    super('sync', executeMethod, query);
  }

  run(placeholderValues?: Record<string, unknown>): NodeRunResult {
    // deno-lint-ignore no-explicit-any
    const params: any[] = fillPlaceholders(
      this.query.params,
      placeholderValues ?? {},
    );
    this.logger.logQuery(this.query.sql, params);
    return this.stmt.run(...params);
  }

  all(placeholderValues?: Record<string, unknown>): T['all'] {
    const {
      fields,
      // @ts-expect-error types
      joinsNotNullableMap,
      query,
      logger,
      stmt,
      customResultMapper,
    } = this;
    // deno-lint-ignore no-explicit-any
    const params: any[] = fillPlaceholders(
      query.params,
      placeholderValues ?? {},
    );
    logger.logQuery(query.sql, params);

    if (customResultMapper) {
      const valuesResult = this.values(placeholderValues) as unknown[][];
      return customResultMapper(valuesResult) as T['all'];
    }

    const rows: Record<string, unknown>[] = stmt.all(...params) as Record<
      string,
      unknown
    >[];
    if (!fields) {
      return rows as T['all'];
    }

    if (!this.fields) {
      return rows as T['all'];
    }
    const valuesResult = rows.map((obj: Record<string, unknown>) => {
      return this.fields!.map((fieldInfo) => {
        const key =
          fieldInfo.path.length > 0
            ? fieldInfo.path[fieldInfo.path.length - 1]
            : undefined;
        return key !== undefined ? obj[key] : undefined;
      });
    });
    return valuesResult.map(
      (row: unknown[]) => mapResultRow(this.fields!, row, joinsNotNullableMap), // Already checked fields above
    );
  }

  get(placeholderValues?: Record<string, unknown>): T['get'] {
    // deno-lint-ignore no-explicit-any
    const params: any[] = fillPlaceholders(
      this.query.params,
      placeholderValues ?? {},
    );
    this.logger.logQuery(this.query.sql, params);
    // @ts-expect-error types
    const { stmt, joinsNotNullableMap, customResultMapper } = this;
    const rowObj = stmt.get(...params);
    if (!rowObj) {
      return undefined;
    }
    if (customResultMapper) {
      if (!this.fields) {
        return customResultMapper([]) as T['get'];
      }
      const rowValues = this.fields.map((fieldInfo) => {
        const key =
          fieldInfo.path.length > 0
            ? fieldInfo.path[fieldInfo.path.length - 1]
            : undefined;
        return key !== undefined
          ? (rowObj as Record<string, unknown>)[key]
          : undefined;
      });
      return customResultMapper([rowValues]) as T['get'];
    }
    if (!this.fields) {
      return rowObj as T['get'];
    }
    const rowValues = this.fields.map((fieldInfo) => {
      const key =
        fieldInfo.path.length > 0
          ? fieldInfo.path[fieldInfo.path.length - 1]
          : undefined;
      return key !== undefined
        ? (rowObj as Record<string, unknown>)[key]
        : undefined;
    });
    return mapResultRow(this.fields, rowValues, joinsNotNullableMap);
  }

  values(placeholderValues?: Record<string, unknown>): T['values'] {
    // deno-lint-ignore no-explicit-any
    const params: any[] = fillPlaceholders(
      this.query.params,
      placeholderValues ?? {},
    );
    this.logger.logQuery(this.query.sql, params);
    const rows: Record<string, unknown>[] = this.stmt.all(...params) as Record<
      string,
      unknown
    >[];
    if (!this.fields) {
      // deno-lint-ignore no-explicit-any
      return rows as any;
    }
    return rows.map((obj: Record<string, unknown>) => {
      return this.fields!.map((fieldInfo) => {
        const key =
          fieldInfo.path.length > 0
            ? fieldInfo.path[fieldInfo.path.length - 1]
            : undefined;
        return key !== undefined ? obj[key] : undefined;
      });
    }) as T['values'];
  }

  /** @internal */
  isResponseInArrayMode(): boolean {
    return this._isResponseInArrayMode;
  }
}
