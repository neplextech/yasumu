import { text, sqliteTable } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { JSONValue } from '@/common/types.ts';

export function json<T = JSONValue>(name = 'metadata') {
  return text(name, { mode: 'json' }).$type<T>();
}

export function cuid(name?: string) {
  return text(name).$defaultFn(() => Yasumu.cuid());
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

export function commonColumns<M = JSONValue>() {
  return {
    id: cuid().primaryKey(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    metadata: json<M>().default({} as M),
  };
}

export type Table<M = JSONValue> = ReturnType<typeof sqliteTable> &
  ReturnType<typeof commonColumns<M>>;
