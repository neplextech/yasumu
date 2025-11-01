/// <reference types="./internal.d.ts" />
import './patches.ts';
import { YasumuUI } from './ui.ts';

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

declare global {
  // deno-lint-ignore no-explicit-any
  export type unsafe = any;
  // deno-lint-ignore no-var
  export var Yasumu: YasumuRuntime;
  // deno-lint-ignore no-var
  export var __yasumu_renderer_event_listener: ((event: string) => void) | null;
}
