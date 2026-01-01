import './yasumu-patch.ts';
import { startServer } from '../src/index.ts';
import { join } from 'node:path';
import type { YasumuRpcContext } from '@yasumu/rpc';

const { rpcServer } = await startServer();

const result = await rpcServer.execute({
  action: 'workspaces.create',
  type: 'query',
  payload: [
    {
      name: 'test-workspace',
      metadata: {
        path: join(Deno.cwd(), '..', '..', 'test-workspace'),
      },
    },
  ],
});

await rpcServer.execute(
  {
    action: 'synchronization.synchronize',
    type: 'mutation',
    payload: [],
  },
  {
    workspaceId: result.id,
  } satisfies YasumuRpcContext,
);
