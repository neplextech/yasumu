/// <reference types="./internal.d.ts" />
import { Console } from 'ext:deno_console/01_console.js';
import { consoleEventQueue } from './utils.ts';

const originalConsole = globalThis.console;

// patch console to send messages to the renderer instead of the standard output
globalThis.console = new Console((msg: string, level: number) => {
  const lvl =
    (<const>['log', 'debug', 'info', 'warn', 'error'])[level] ?? 'log';

  originalConsole[lvl]?.(msg);

  // push the message to the console event queue
  // this also handles the case where the Yasumu runtime is not ready yet
  // and the message is buffered until the runtime is ready
  consoleEventQueue.enqueue({ msg, level }).catch(Object);
});

// disable confirm() and prompt() and alert()
globalThis.confirm = () => false;
globalThis.prompt = () => null;
globalThis.alert = () => {};
