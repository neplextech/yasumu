/// <reference types="./internal.d.ts" />
import { Console } from 'ext:deno_console/01_console.js';
import { op_send_renderer_event } from 'ext:core/ops';

let _initYasumuBuffer = false;

const MAX_BUFFER_SIZE = 100;
const buffer: string[] = [];

const originalConsole = globalThis.console;

// patch console to send messages to the renderer instead of the standard output
globalThis.console = new Console((msg: string, level: number) => {
  const lvl =
    (<const>['log', 'debug', 'info', 'warn', 'error'])[level] ?? 'log';
  originalConsole[lvl](msg, level);

  if (!Yasumu.isReady()) {
    if (!_initYasumuBuffer) {
      Yasumu.onReady(() => {
        for (const event of buffer) {
          op_send_renderer_event(event);
        }

        buffer.length = 0;
      });
      _initYasumuBuffer = true;
    }

    // truncate from the beginning of the buffer
    if (buffer.length >= MAX_BUFFER_SIZE) {
      buffer.splice(0, buffer.length - MAX_BUFFER_SIZE);
    }

    buffer.push(JSON.stringify({ type: 'console', payload: { msg, level } }));
    return;
  }

  op_send_renderer_event(
    JSON.stringify({ type: 'console', payload: { msg, level } }),
  );
});

// disable confirm() and prompt() and alert()
globalThis.confirm = () => false;
globalThis.prompt = () => null;
globalThis.alert = () => {};
