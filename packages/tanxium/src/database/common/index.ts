import {
  text,
  sqliteTable,
  SQLiteColumnBuilderBase,
} from 'drizzle-orm/sqlite-core';
import { ColumnBuilderBaseConfig, ColumnDataType, sql } from 'drizzle-orm';

export type Metadata = Record<string, unknown>;

export function json<T extends Metadata = Metadata>(name = 'metadata') {
  return text(name, { mode: 'json' }).$type<T>();
}

export function cuid() {
  return text().$defaultFn(() => Yasumu.cuid());
}

export function createdAt() {
  return text('createdAt')
    .notNull()
    .default(sql`(current_timestamp)`);
}

export function updatedAt() {
  return text('updatedAt')
    .notNull()
    .default(sql`(current_timestamp)`)
    .$onUpdateFn(() => sql`(current_timestamp)`);
}

export function createTable<
  M extends Metadata = Metadata,
  N extends string = string,
  C extends Record<
    string,
    SQLiteColumnBuilderBase<
      ColumnBuilderBaseConfig<ColumnDataType, string>,
      object
    >
  > = Record<
    string,
    SQLiteColumnBuilderBase<
      ColumnBuilderBaseConfig<ColumnDataType, string>,
      object
    >
  >,
>(name: N, columns: C) {
  return sqliteTable(name, {
    ...columns,
    id: cuid().primaryKey(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    metadata: json<M>().default({} as M),
  });
}
