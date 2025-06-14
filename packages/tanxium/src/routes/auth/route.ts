import { Hono } from 'hono';

export const auth = new Hono();

auth.post('/connect', (c) => {
  // TODO: Implement auth logic
  return c.json({ success: true });
});
