import './preload.ts';
// @ts-ignore types are not bundled
import { startServer } from './yasumu-server/index.js';

await startServer();

import './init.ts';
