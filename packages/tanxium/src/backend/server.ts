import { Hono } from 'hono';
import { logger } from 'hono/logger';

import { yasumuRpcRoute } from './routes/yasumu-rpc.ts';

export const app = new Hono()
  .use(logger())
  .route('/rpc', yasumuRpcRoute)
  .get('/', (c) => {
    return c.json({
      message: 'hello from the other side',
    });
  })
  .notFound((c) => {
    return c.json(
      {
        message: 'Endpoint not found',
      },
      404,
    );
  })
  .onError((err, c) => {
    console.error(err);
    return c.json(
      {
        message: err.message,
      },
      500,
    );
  });

export type AppType = typeof app;
