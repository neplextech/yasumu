import { createRequire } from 'node:module';

// inject the require function
globalThis.require = createRequire(import.meta.url);
