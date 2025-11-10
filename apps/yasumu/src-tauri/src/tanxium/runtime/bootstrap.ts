/// <reference types="./internal.d.ts" />
import './patches.ts';
import { YasumuUI } from './ui.ts';
import {
  op_get_resources_dir,
  op_set_rpc_port,
  op_generate_cuid,
  op_is_yasumu_ready,
} from 'ext:core/ops';
import { join } from 'node:path';

let _resourceDir: string;

/**
 * Yasumu Runtime API
 */
interface YasumuRuntime {
  /**
   * Yasumu UI API
   */
  ui: typeof YasumuUI;
  /**
   * Generate random CUID
   */
  cuid: () => string;
  /**
   * Get the resources directory
   * @returns The resources directory
   */
  getResourcesDir: () => string;
  /**
   * Get the server entrypoint
   * @returns The server entrypoint
   */
  getServerEntrypoint: () => string;
  /**
   * Check if the Yasumu runtime is ready
   * @returns True if the Yasumu runtime is ready, false otherwise
   */
  isReady: () => boolean;
  /**
   * Set the RPC port
   * @param port The port to set
   */
  setRpcPort: (port: number) => void;
  /**
   * Register a listener for events from the renderer
   * @param listener The listener to register
   * @returns A function to remove the listener
   */
  onEvent: (listener: (event: string) => unknown) => () => void;
  /**
   * Register a listener for when the Yasumu runtime is ready
   * @param listener The listener to register
   * @returns A function to remove the listener
   */
  onReady: (listener: () => unknown) => () => void;
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
const readyListeners: Set<() => unknown> = new Set();
const Yasumu: YasumuRuntime = {
  ui: YasumuUI,
  cuid: () => {
    return op_generate_cuid();
  },
  getResourcesDir: () => {
    if (!_resourceDir) {
      _resourceDir = op_get_resources_dir();
    }

    return _resourceDir;
  },
  getServerEntrypoint: () => {
    return join(Yasumu.getResourcesDir(), 'yasumu-internal', 'yasumu-server');
  },
  isReady: () => {
    return op_is_yasumu_ready();
  },
  setRpcPort: (port: number) => {
    op_set_rpc_port(port);
  },
  onReady: (listener: () => unknown) => {
    if (Yasumu.isReady()) {
      listener();
      return () => {};
    }

    readyListeners.add(listener);

    return () => {
      readyListeners.delete(listener);
    };
  },
  onEvent: (listener: (event: string) => unknown) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
  '~yasumu__on__Event__Callback': async (event: string) => {
    try {
      const parsed = JSON.parse(event);
      const isReadyEvent = parsed.type === 'yasumu_internal_ready_event';
      const targetHandlers = isReadyEvent ? readyListeners : listeners;

      await Promise.allSettled(
        Array.from(targetHandlers, async (listener) => {
          try {
            await listener(parsed);
            if (isReadyEvent) {
              readyListeners.delete(listener as () => unknown);
            }
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
