import { join } from 'path';
import { createYasumu } from '../src/index.ts';
import { server } from './server.js';

const yasumu = createYasumu({
  platformBridge: {
    invoke: server.handler,
  },
});

const workspaces = await yasumu.workspaces.list();
console.log({ foundExistingWorkspaces: workspaces });

const workspace = workspaces[0]
  ? await yasumu.workspaces.open({ id: workspaces[0].id })
  : await yasumu.workspaces.create({
      metadata: {
        path: join(import.meta.dirname, '/yasumu'),
      },
      name: 'Test Workspace',
    });

console.log({ createdWorkspace: workspace });

const rests = await workspace.rest.list();
console.log({ foundExistingRests: rests });

if (!rests.length) {
  const data = await workspace.rest.create({
    name: 'Test Rest',
    method: 'GET',
    url: 'https://api.example.com',
    metadata: {},
  });

  console.log({ createdRest: data });
}
