import { text, sqliteTable, integer } from 'drizzle-orm/sqlite-core';
import { JSONValue } from '@/common/types.ts';

export function json<T = JSONValue>(name = 'metadata') {
  return text(name, { mode: 'json' }).$type<T>();
}

export function cuid(name?: string) {
  return text(name).$defaultFn(() => Yasumu.cuid());
}

export function timestamp(name?: string) {
  if (!name) return integer();
  return integer(name);
}

export function createdAt() {
  return timestamp('createdAt')
    .notNull()
    .$defaultFn(() => Date.now());
}

export function updatedAt() {
  return timestamp('updatedAt')
    .notNull()
    .$defaultFn(() => Date.now())
    .$onUpdateFn(() => Date.now());
}

export function commonColumns<M = JSONValue>() {
  return {
    id: cuid().primaryKey(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    metadata: json<M>()
      .notNull()
      .default({} as M),
  };
}

export type Table<M = JSONValue> = ReturnType<typeof sqliteTable> &
  ReturnType<typeof commonColumns<M>>;
