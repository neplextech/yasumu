import './yasumu-patch.ts';
import { startServer } from '../src/index.ts';

const { rpcServer } = await startServer();

const result = await rpcServer.execute(
  {
    action: 'workspaces.list',
    payload: [{}],
    type: 'query',
  },
  {},
);

console.log(result);
