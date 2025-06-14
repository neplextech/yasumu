import { Hono } from 'hono';

export const rest = new Hono();

rest.post('/', (c) => {
  return c.json({ message: 'Hello, world!' });
});
