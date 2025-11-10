import { Hono } from 'hono';
import { db } from '../database/index.ts';
import { workspacesTable } from '../database/schema.ts';
import { eq } from 'drizzle-orm';

export const app = new Hono();

app.get('/', (c) => c.json({ message: 'Hello from Tanxium!' }));

app.get('/workspaces', async (c) => {
  const workspaces = await db.select().from(workspacesTable).all();
  return c.json(workspaces);
});

app.get('/workspace/:id', async (c) => {
  const workspace = await db
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.id, c.req.param('id')))
    .get();
  return c.json(workspace);
});

app.get('/create-workspace', async (c) => {
  const workspace = await db
    .insert(workspacesTable)
    .values({
      name: `New Workspace ${Date.now()}`,
      metadata: {
        test: true,
      },
    })
    .returning();
  return c.json(workspace);
});

app.get('/delete-workspace/:id', async (c) => {
  await db
    .delete(workspacesTable)
    .where(eq(workspacesTable.id, c.req.param('id')));
  return c.json({ message: 'Workspace deleted' });
});
