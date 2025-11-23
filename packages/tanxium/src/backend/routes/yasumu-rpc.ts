import { Hono } from 'hono';
import { yasumuRpcServer } from '../../rpc/yasumu-rpc-server.ts';

export const yasumuRpcRoute = new Hono().post('/', async (c) => {
  const { context, command } = await c.req.json();

  const result = await yasumuRpcServer.handler(context, command);

  return c.json(result);
});
