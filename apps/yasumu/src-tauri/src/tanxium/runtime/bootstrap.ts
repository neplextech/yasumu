/// <reference types="./internal.d.ts" />
import './patches.ts';
import { YasumuUI } from './ui.ts';
import {
  op_get_resources_dir,
  op_get_app_data_dir,
  op_set_rpc_port,
  op_generate_cuid,
  op_is_yasumu_ready,
  op_get_yasumu_version,
  op_set_echo_server_port,
  op_register_virtual_module,
  op_unregister_virtual_module,
  op_is_yasumu_dev_mode,
  op_get_rpc_port,
  op_unregister_all_virtual_modules,
} from 'ext:core/ops'; // defined in resources/yasumu-scripts/yasumu-internal.d.ts
import { join } from 'node:path';
import { rendererEventQueue, isWorkerEnvironment } from './utils.ts';
import {
  YasumuRequest,
  YasumuResponse,
  YasumuHeaders,
  YasumuURLSearchParams,
  YasumuWorkspaceEnvironment,
} from './yasumu-request.ts';

let _resourceDir: string, _yasumuVersion: string, _appDataDir: string;

const __yasumuIsDevMode = op_is_yasumu_dev_mode();

const listeners: Set<(event: string) => unknown> = new Set();
const readyListeners: Set<() => unknown> = new Set();
const YASUMU_INTERNAL_ON_EVENT_CALLBACK = '~yasumu__on__Event__Callback';

class Yasumu {
  /**
   * Yasumu UI API
   */
  public static readonly ui = YasumuUI;

  private constructor() {
    throw new Error('Yasumu is not a constructor');
  }

  /**
   * Register a virtual module. This allows workers or scripts to access modules that are not part of the main bundle.
   * The registered module is available as `yasumu:virtual/<name>` in the worker or script.
   * @param name The name of the module to register
   * @param code The code of the module to register
   */
  public static registerVirtualModule(name: string, code: string) {
    if (isWorkerEnvironment()) return;
    op_register_virtual_module(name, code);
  }

  /**
   * Unregister a virtual module. This is used to clean up the virtual module store when a worker or script is terminated.
   * @param name The name of the module to unregister
   */
  public static unregisterVirtualModule(name: string) {
    if (isWorkerEnvironment()) return;
    op_unregister_virtual_module(name);
  }

  /**
   * Unregister all virtual modules.
   */
  public static unregisterAllVirtualModules() {
    if (isWorkerEnvironment()) return;
    op_unregister_all_virtual_modules();
  }

  /**
   * Check if the Yasumu runtime is running in dev mode
   * @returns True if the Yasumu runtime is running in dev mode, false otherwise
   */
  public static get isDevMode() {
    return __yasumuIsDevMode;
  }

  /**
   * Get the current version of Yasumu
   */
  public static get version() {
    return (_yasumuVersion ??= op_get_yasumu_version());
  }

  /**
   * Generate random CUID
   */
  public static cuid() {
    return op_generate_cuid();
  }

  /**
   * Send a custom message to the renderer
   * @param message The message to send
   */
  public static postMessage(message: unsafe) {
    return rendererEventQueue.enqueue({
      type: 'message',
      payload: message,
    });
  }

  /**
   * Strip the verbatim path from the path
   * @param path The path to strip
   * @returns The stripped path
   */
  public static stripVerbatimPath(path: string): string {
    if (path.startsWith('\\\\?\\UNC\\')) {
      return '\\' + path.slice(8);
    }

    return path.replace(/^\\\\\?\\/, '');
  }

  /**
   * Get the resources directory
   * @returns The resources directory
   */
  public static getResourcesDir() {
    if (!_resourceDir) {
      _resourceDir = join(
        Yasumu.stripVerbatimPath(op_get_resources_dir()),
        'resources',
      );
    }

    return _resourceDir;
  }

  /**
   * Get the app data directory (platform-specific)
   * @returns The app data directory
   */
  public static getAppDataDir() {
    if (!_appDataDir) {
      _appDataDir = Yasumu.stripVerbatimPath(op_get_app_data_dir());
    }

    return _appDataDir;
  }

  /**
   * Get the server entrypoint
   * @returns The server entrypoint
   */
  public static getServerEntrypoint() {
    return join(Yasumu.getResourcesDir(), 'yasumu-scripts', 'yasumu-server');
  }

  /**
   * Check if the Yasumu runtime is ready
   * @returns True if the Yasumu runtime is ready, false otherwise
   */
  public static isReady() {
    return op_is_yasumu_ready();
  }

  /**
   * Set the RPC port
   * @param port The port to set
   */
  public static setRpcPort(port: number) {
    if (isWorkerEnvironment()) return;
    op_set_rpc_port(port);
  }

  /**
   * Get the RPC port
   * @returns The RPC port
   */
  public static getRpcPort() {
    return op_get_rpc_port();
  }

  /**
   * Set the echo server port
   * @param port The port to set
   */
  public static setEchoServerPort(port: number) {
    if (isWorkerEnvironment()) return;
    op_set_echo_server_port(port);
  }

  /**
   * Register a listener for when the Yasumu runtime is ready
   * @param listener The listener to register
   * @returns A function to remove the listener
   */
  public static onReady(listener: () => unknown) {
    if (isWorkerEnvironment()) return () => {};
    if (Yasumu.isReady()) {
      listener();
      return () => {};
    }

    readyListeners.add(listener);

    return () => {
      readyListeners.delete(listener);
    };
  }

  /**
   * Register a listener for events from the renderer
   * @param listener The listener to register
   * @returns A function to remove the listener
   */
  public static onEvent(listener: (event: string) => unknown) {
    if (isWorkerEnvironment()) return () => {};
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  /**
   * Internal event callback
   * @param event The event to callback
   * @returns The result of the callback
   * @private
   * @internal
   */
  private static async [YASUMU_INTERNAL_ON_EVENT_CALLBACK](event: string) {
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
  }
}

Object.defineProperties(globalThis, {
  Yasumu: {
    value: Yasumu,
    writable: false,
    enumerable: false,
    configurable: false,
  },
  YasumuRequest: {
    value: YasumuRequest,
    writable: false,
    enumerable: false,
    configurable: false,
  },
  YasumuResponse: {
    value: YasumuResponse,
    writable: false,
    enumerable: false,
    configurable: false,
  },
  YasumuHeaders: {
    value: YasumuHeaders,
    writable: false,
    enumerable: false,
    configurable: false,
  },
  YasumuURLSearchParams: {
    value: YasumuURLSearchParams,
    writable: false,
    enumerable: false,
    configurable: false,
  },
  YasumuWorkspaceEnvironment: {
    value: YasumuWorkspaceEnvironment,
    writable: false,
    enumerable: false,
    configurable: false,
  },
});

type YasumuRuntime = typeof Yasumu;
type YasumuRequestType = typeof YasumuRequest;
type YasumuResponseType = typeof YasumuResponse;
type YasumuHeadersType = typeof YasumuHeaders;
type YasumuURLSearchParamsType = typeof YasumuURLSearchParams;
type YasumuWorkspaceEnvironmentType = typeof YasumuWorkspaceEnvironment;

declare global {
  // deno-lint-ignore no-explicit-any
  export type unsafe = any;
  /**
   * Yasumu specific runtime APIs
   */
  // deno-lint-ignore no-var
  export var Yasumu: YasumuRuntime;
  // deno-lint-ignore no-var
  export var YasumuRequest: YasumuRequestType;
  // deno-lint-ignore no-var
  export var YasumuResponse: YasumuResponseType;
  // deno-lint-ignore no-var
  export var YasumuHeaders: YasumuHeadersType;
  // deno-lint-ignore no-var
  export var YasumuURLSearchParams: YasumuURLSearchParamsType;
  // deno-lint-ignore no-var
  export var YasumuWorkspaceEnvironment: YasumuWorkspaceEnvironmentType;
  // deno-lint-ignore no-var
  export var __yasumu_renderer_event_listener: ((event: string) => void) | null;
}
