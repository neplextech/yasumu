import { Hono } from 'hono';
import { workspacesRoute } from './routes/workspaces/route.ts';
import { restRoute } from './routes/rest/route.ts';

export const app = new Hono()
  .route('/workspaces', workspacesRoute)
  .route('/rest', restRoute)
  .get('/', (c) => {
    return c.json({
      message: 'hello from the other side',
    });
  });

export type AppType = typeof app;
