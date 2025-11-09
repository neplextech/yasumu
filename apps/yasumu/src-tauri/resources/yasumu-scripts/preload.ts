import { createRequire } from 'node:module';

// inject the require function
if (typeof require !== 'function') {
  globalThis.require = createRequire(import.meta.url);
}
