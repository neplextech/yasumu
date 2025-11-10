import { drizzle } from './sqlite/index.ts';

export const db = drizzle('file:yasumu.db');
