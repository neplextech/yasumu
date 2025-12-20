import './yasumu-patch.ts';
import { startServer } from '../src/index.ts';

const { rpcServer } = await startServer();

const result = await rpcServer.execute({
  action: 'workspaces.list',
  type: 'query',
  payload: [{ take: 10 }],
});

console.log(result);
