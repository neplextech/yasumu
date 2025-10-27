import type { RpcCommandData } from './yasumu-rpc.js';

/**
 * A platform bridge is used to connect Yasumu and the underlying platform.
 */
export interface PlatformBridge {
  /**
   * Makes a request to the platform.
   * @param command - The command to invoke.
   * @returns The result of the command invocation.
   */
  invoke<T = unknown>(command: RpcCommandData): Promise<T>;
}
