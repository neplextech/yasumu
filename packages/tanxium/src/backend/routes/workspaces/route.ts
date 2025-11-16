import { Hono } from 'hono';
import { db } from '@/database/index.ts';
import { desc, eq, sql } from 'drizzle-orm';
import { workspaces } from '@/database/schema.ts';

export const workspacesRoute = new Hono()
  .get('/', async (c) => {
    const { skip, take } = c.req.query();

    const totalWorkspaces = await db
      .select({ count: sql<number>`count(*)` })
      .from(workspaces)
      .then((rows) => rows[0]?.count ?? 0);

    const workspacesList = await db
      .select()
      .from(workspaces)
      .orderBy(desc(workspaces.updatedAt))
      .limit(Number(take) || 10)
      .offset(Number(skip) || 0);

    return c.json({
      totalItems: totalWorkspaces,
      items: workspacesList,
    });
  })
  .post('/', async (c) => {
    const { name, path } = await c.req.json();
    const workspace = await db
      .insert(workspaces)
      .values({ name, metadata: { path } })
      .returning();
    return c.json(workspace);
  })
  .delete('/:id', async (c) => {
    const { id } = c.req.param();
    await db.delete(workspaces).where(eq(workspaces.id, id));
    return c.json({ message: 'Workspace deleted' });
  })
  .get('/:id', async (c) => {
    const { id } = c.req.param();
    const workspace = await db.query.workspaces.findFirst({
      where: ({ id: workspaceId }, { eq }) => eq(workspaceId, id),
      with: {
        environments: true,
      },
    });
    return c.json(workspace);
  });
