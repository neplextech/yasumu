import { Hono } from 'hono';
import { prisma } from '../database/index.ts';

export const app = new Hono();

app.get('/', (c) => c.json({ message: 'Hello from Tanxium!' }));

app.get('/workspace', async (c) => {
  const workspaces = await prisma.workspace.findMany();
  return c.json(workspaces);
});

app.post('/workspace', async (c) => {
  const workspace = await prisma.workspace.create({
    data: {
      name: 'New Workspace',
      metadata: {
        test: true,
      },
    },
  });
  return c.json(workspace);
});
