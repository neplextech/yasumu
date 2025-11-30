import { drizzle } from './sqlite/index.ts';
import * as schema from './schema.ts';
import { AsyncLocalStorage } from 'node:async_hooks';

export const db = drizzle('file:yasumu.db', { schema });

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const TransactionContext = new AsyncLocalStorage<{
  transaction: Transaction;
}>();

// deno-lint-ignore no-explicit-any
export function runInTransaction<T extends () => any>(
  receiver: T,
): ReturnType<T> {
  return db.transaction((tx) => {
    return TransactionContext.run({ transaction: tx }, receiver);
  });
}
