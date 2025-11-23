import { Hono } from 'hono';
import { yasumuRpcRoute } from './routes/yasumu-rpc.ts';

export const app = new Hono()
  .route('/yasumu.rpc', yasumuRpcRoute)
  .get('/', (c) => {
    return c.json({
      message: 'hello from the other side',
    });
  });

export type AppType = typeof app;
