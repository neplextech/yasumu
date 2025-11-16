import { drizzle } from './sqlite/index.ts';
import * as schema from './schema.ts';

export const db = drizzle('file:yasumu.db', { schema });
