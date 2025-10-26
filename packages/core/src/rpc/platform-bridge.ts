import type { RpcCommandData } from './yasumu-rpc.js';

export interface PlatformBridge {
  /**
   * Makes a request to the platform.
   * @param method - The method to invoke.
   * @param args - The arguments to pass to the method.
   * @returns The result of the method invocation.
   */
  invoke<T = unknown>(command: RpcCommandData): Promise<T>;
  /**
   * Subscribes to a platform event.
   * @param event - The event to subscribe to.
   * @param callback - The callback to call when the event is triggered.
   */
  subscribe(event: string, callback: (data: unknown) => void): void;
  /**
   * Unsubscribes from a platform event.
   * @param event - The event to unsubscribe from.
   * @param callback - The callback to unsubscribe from.
   */
  unsubscribe(event: string, callback: (data: unknown) => void): void;
}
