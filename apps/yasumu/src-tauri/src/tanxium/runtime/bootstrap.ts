/// <reference types="./internal.d.ts" />
import { YasumuUI } from './ui.ts';
import { op_send_renderer_event } from 'ext:core/ops';
import { Console } from 'ext:deno_console/01_console.js';

/**
 * Yasumu Runtime API
 */
interface YasumuRuntime {
  /**
   * Yasumu UI API
   */
  ui: typeof YasumuUI;
  /**
   * Register a listener for events from the renderer
   * @param listener The listener to register
   * @returns A function to remove the listener
   */
  onEvent: (listener: (event: string) => unknown) => () => void;
  /**
   * Internal event callback
   * @param event The event to callback
   * @returns The result of the callback
   * @private
   * @internal
   */
  '~yasumu__on__Event__Callback': (event: string) => unknown;
}

const listeners: Set<(event: string) => unknown> = new Set();
const Yasumu: YasumuRuntime = {
  ui: YasumuUI,
  onEvent: (listener: (event: string) => unknown) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
  '~yasumu__on__Event__Callback': async (event: string) => {
    try {
      const parsed = JSON.parse(event);

      await Promise.allSettled(
        Array.from(listeners, async (listener) => {
          try {
            await listener(parsed);
          } catch (e) {
            console.error('Failed to call listener:', e);
          }
        }),
      );
    } catch (e) {
      console.error('Failed to parse renderer event:', e);
    }
  },
};

Object.defineProperty(globalThis, 'Yasumu', {
  value: Yasumu,
  writable: false,
  enumerable: false,
  configurable: false,
});

// patch console to send messages to the renderer instead of the standard output
globalThis.console = new Console((msg: string, level: number) => {
  op_send_renderer_event(
    JSON.stringify({ type: 'console', payload: { msg, level } }),
  );
});

declare global {
  // deno-lint-ignore no-explicit-any
  export type unsafe = any;
  // deno-lint-ignore no-var
  export var Yasumu: YasumuRuntime;
  // deno-lint-ignore no-var
  export var __yasumu_renderer_event_listener: ((event: string) => void) | null;
}
