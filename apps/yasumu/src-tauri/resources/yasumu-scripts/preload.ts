import { createRequire } from 'node:module';
import { setTimeout, setInterval } from 'node:timers';

// inject the require function
if (typeof require !== 'function') {
  globalThis.require = createRequire(import.meta.url);
}

// @ts-ignore smtp-server needs node timer
globalThis.setTimeout = setTimeout;
// @ts-ignore smtp-server needs node timer
globalThis.setInterval = setInterval;
