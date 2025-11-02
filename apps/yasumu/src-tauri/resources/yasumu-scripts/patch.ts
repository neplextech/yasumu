import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import * as async_hooks from 'node:async_hooks';
import * as events from 'node:events';
// import * as module from 'node:module';

const builtins = {
  'node:path': path,
  'node:fs': fs,
  'node:os': os,
  'node:crypto': crypto,
  'node:async_hooks': async_hooks,
  'node:events': events,
};

// @ts-ignore patch
globalThis.require = (moduleName: string) => {
  const mod = builtins[moduleName as keyof typeof builtins];

  if (!mod) {
    throw new Error(`Module ${moduleName} not found`);
  }

  return mod;
};

// // @ts-ignore patch
// // deno-lint-ignore no-import-assign
// module.createRequire = () => {
//   return globalThis.require;
// };
