import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/database/schema/*',
  out: './drizzle',
  dbCredentials: {
    url: 'tanxium.db',
  },
});
