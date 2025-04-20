import type { Callback } from './common.js';

export type InvokeArgs =
  | Record<string, any>
  | number[]
  | ArrayBuffer
  | Uint8Array;

export interface InvokeOptions {
  headers: Headers | Record<string, string>;
}

export interface PluginListenerCommon {
  readonly channelId: number;
  readonly event: string;
  readonly plugin: string;
  unregister(): Promise<void>;
}

export interface CommandCommon {
  addPluginListener<T = unknown>(
    plugin: string,
    event: string,
    cb: Callback<[T]>,
  ): Promise<PluginListenerCommon>;
  invoke<T = unknown>(
    command: string,
    args?: InvokeArgs,
    options?: InvokeOptions,
  ): Promise<T>;
}
