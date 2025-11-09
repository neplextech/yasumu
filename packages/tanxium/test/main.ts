import './yasumu-patch.ts';
import { startServer } from '../src/index.ts';

startServer().catch((error) => {
  console.error('Failed to start server', error);
});
