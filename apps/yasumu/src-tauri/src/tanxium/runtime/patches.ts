/// <reference types="./internal.d.ts" />
import { Console } from 'ext:deno_console/01_console.js';
import { op_send_renderer_event } from 'ext:core/ops';

// patch console to send messages to the renderer instead of the standard output
globalThis.console = new Console((msg: string, level: number) => {
  op_send_renderer_event(
    JSON.stringify({ type: 'console', payload: { msg, level } }),
  );
});

// disable confirm() and prompt() and alert()
globalThis.confirm = () => false;
globalThis.prompt = () => null;
globalThis.alert = () => {};
