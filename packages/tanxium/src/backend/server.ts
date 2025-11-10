import { Hono } from 'hono';
import { db } from '../database/index.ts';
import { workspacesTable } from '../database/schema.ts';

export const app = new Hono();

app.get('/', (c) => c.json({ message: 'Hello from Tanxium!' }));

app.get('/workspace', async (c) => {
  const workspaces = await db.select().from(workspacesTable).all();
  return c.json(workspaces);
});

app.post('/workspace', async (c) => {
  const workspace = await db
    .insert(workspacesTable)
    .values({
      name: 'New Workspace',
      metadata: {
        test: true,
      },
    })
    .returning();
  return c.json(workspace);
});
