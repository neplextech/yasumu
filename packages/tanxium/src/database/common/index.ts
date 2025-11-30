import { text, sqliteTable } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { JSONValue } from '@/common/types.ts';

export function json<T = JSONValue>(name = 'metadata') {
  return text(name, { mode: 'json' }).$type<T>();
}

export function cuid(name?: string) {
  return text(name).$defaultFn(() => Yasumu.cuid());
}

type CommonColumn = {
  createdAt: string;
  updatedAt: string;
};

export type MappedCommonColumn<T extends CommonColumn | CommonColumn[]> =
  T extends CommonColumn[]
    ? MappedCommonColumn<T[number]>[]
    : Omit<T, 'createdAt' | 'updatedAt' | 'lastOpenedAt'> & {
        createdAt: Date;
        updatedAt: Date;
      };

export function mapResult<T extends CommonColumn | CommonColumn[]>(
  result: T,
): MappedCommonColumn<T> {
  if (Array.isArray(result)) {
    return result.map((item) =>
      mapResult(item),
    ) as unknown as MappedCommonColumn<T>;
  }

  return {
    ...result,
    createdAt: new Date(result.createdAt),
    updatedAt: new Date(result.updatedAt),
    // @ts-expect-error types
    ...(result.lastOpenedAt
      ? // @ts-expect-error types
        { lastOpenedAt: new Date(result.lastOpenedAt) }
      : {}),
  } as unknown as MappedCommonColumn<T>;
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
    metadata: json<M>()
      .notNull()
      .default({} as M),
  };
}

export type Table<M = JSONValue> = ReturnType<typeof sqliteTable> &
  ReturnType<typeof commonColumns<M>>;
