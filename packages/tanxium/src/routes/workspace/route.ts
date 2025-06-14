import { Hono } from 'hono';

export const workspace = new Hono();

workspace.post('/', (c) => {
  return c.json({ message: 'Hello, world!' });
});
