import './patch.ts';
// @ts-ignore types are not bundled
import { startServer } from './yasumu-server/index.js';

await startServer();
