import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { errors } from './schema/errors.ts';

const sqlite = new DatabaseSync('tanxium.db', {
  open: true,
});

export const db = drizzle(
  async (sql, params, method) => {
    const stmt = sqlite.prepare(sql);

    if (method === 'all' || method === 'values') {
      return { rows: stmt.all(...params) };
    }

    return { rows: [stmt[method](...params)] };
  },
  {
    schema: {
      errors,
    },
  },
);
