import { Hono } from 'hono';
import { db } from '@/database/index.ts';
import { rest } from '@/database/schema.ts';
import { sql } from 'drizzle-orm';

export const restRoute = new Hono()
  .get('/', async (c) => {
    const { skip, take } = c.req.query();

    const totalRest = await db
      .select({ count: sql<number>`count(*)` })
      .from(rest)
      .then((rows) => rows[0]?.count ?? 0);

    const restList = await db
      .select()
      .from(rest)
      .limit(Number(take) || 10)
      .offset(Number(skip) || 0);

    return c.json({
      totalItems: totalRest,
      items: restList,
    });
  })
  .get('/:id', async (c) => {
    const { id } = c.req.param();
    const rest = await db.query.rest.findFirst({
      where: ({ id: restId }, { eq }) => eq(restId, id),
      with: {
        entities: true,
      },
    });
    return c.json(rest);
  });
